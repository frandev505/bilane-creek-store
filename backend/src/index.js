const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
require('dotenv').config();

// <-- STRIPE: Importamos las rutas de pago
const paymentRoutes = require('./routes/paymentRoutes'); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// FUNCIÓN DE AUDITORÍA 👁️
// ==========================================
const registrarAuditoria = async (id_usuario, accion, detalles) => {
  try {
    if (id_usuario && id_usuario !== 'guest') {
      await pool.query(
        'INSERT INTO logs_auditoria (id_usuario, accion, detalles) VALUES ($1, $2, $3)',
        [id_usuario, accion, detalles]
      );
    }
  } catch (error) {
    console.error("Error silencioso al registrar auditoría:", error);
  }
};

// ==========================================
// MIDDLEWARE DE SEGURIDAD (AUDITOR) 🛡️
// ==========================================
const bloquearAuditor = (req, res, next) => {
  const rol = req.body.requesterRole || req.headers['x-user-role'];
  if (rol === 'auditor' && req.method !== 'GET') {
    return res.status(403).json({ 
      error: "Acceso denegado: Los auditores tienen permisos estrictos de solo lectura." 
    });
  }
  next();
};

// <-- STRIPE: Uso de rutas de pago
app.use('/api/pagos', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ mensaje: "API de Bilane Creek lista" });
});

// ==========================================
// LOGIN Y REGISTRO
// ==========================================
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre, email, rol, password_hash, activo, intentos_fallidos FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    const usuario = result.rows[0];

    if (!usuario.activo) {
      if (usuario.intentos_fallidos >= 3) {
         return res.status(403).json({ error: "Cuenta bloqueada por múltiples intentos fallidos." });
      }
      return res.status(403).json({ error: "Tu cuenta está inhabilitada." });
    }

    const match = await bcrypt.compare(password, usuario.password_hash);

    if (match) {
      await pool.query(
        'UPDATE usuarios SET intentos_fallidos = 0, ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = $1',
        [usuario.id_usuario]
      );
      return res.json({
        success: true,
        usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol }
      });
    } else {
      const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1;
      if (nuevosIntentos >= 3) {
        await pool.query('UPDATE usuarios SET intentos_fallidos = $1, activo = false WHERE id_usuario = $2', [nuevosIntentos, usuario.id_usuario]);
        return res.status(401).json({ error: "Cuenta bloqueada por seguridad." });
      } else {
        await pool.query('UPDATE usuarios SET intentos_fallidos = $1 WHERE id_usuario = $2', [nuevosIntentos, usuario.id_usuario]);
        return res.status(401).json({ error: `Contraseña incorrecta. Intentos restantes: ${3 - nuevosIntentos}` });
      }
    }
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post('/api/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, activo, intentos_fallidos) VALUES ($1, $2, $3, 'cliente', true, 0) RETURNING id_usuario, nombre, email, rol",
      [nombre, email, hashedPassword]
    );
    res.status(201).json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear cuenta" });
  }
});

// ==========================================
// PRODUCTOS Y CATEGORÍAS
// ==========================================
app.get('/api/productos', async (req, res) => {
  const { admin } = req.query;
  try {
    const query = admin 
      ? `SELECT p.id_producto, p.nombre, p.precio_base, p.imagen_url, p.tipo_venta, p.activo, c.nombre as categoria, p.id_categoria, COALESCE(v.stock, 0) as stock 
         FROM productos p 
         JOIN categorias c ON p.id_categoria = c.id_categoria 
         LEFT JOIN inventario_variantes v ON p.id_producto = v.id_producto
         ORDER BY p.created_at DESC`
      : `SELECT p.id_producto, p.nombre, p.precio_base, p.imagen_url, p.tipo_venta, c.nombre as categoria, COALESCE(v.stock, 0) as stock 
         FROM productos p 
         JOIN categorias c ON p.id_categoria = c.id_categoria 
         LEFT JOIN inventario_variantes v ON p.id_producto = v.id_producto
         WHERE p.activo = true ORDER BY p.created_at DESC`;
         
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// ==========================================
// CREAR, EDITAR Y CAMBIAR ESTADO DE PRODUCTOS
// ==========================================

// 1. CREAR NUEVO PRODUCTO (POST)
app.post('/api/productos', async (req, res) => {
  const { nombre, precio_base, id_categoria, imagen_url, tipo_venta, stock, requesterId } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN'); // Iniciar transacción
    
    // Insertar el producto en la tabla principal
    const insertProd = await client.query(
      `INSERT INTO productos (nombre, precio_base, id_categoria, imagen_url, tipo_venta, activo) 
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id_producto`,
      [nombre, precio_base, id_categoria, imagen_url, tipo_venta]
    );
    const nuevoId = insertProd.rows[0].id_producto;

    // 🔥 SOLUCIÓN AL ERROR 500: Le enviamos 'Única' y 'N/A' para cumplir con los campos obligatorios
    await client.query(
      `INSERT INTO inventario_variantes (id_producto, talla, color, stock) VALUES ($1, $2, $3, $4)`,
      [nuevoId, 'Única', 'N/A', stock || 0]
    );

    await client.query('COMMIT'); // Guardar cambios
    
    // Registrar en auditoría
    if (requesterId) await registrarAuditoria(requesterId, 'CREAR_PRODUCTO', `Producto ID: ${nuevoId}`);
    
    res.status(201).json({ success: true, id_producto: nuevoId });
  } catch (err) {
    await client.query('ROLLBACK'); // Revertir si hay error
    console.error("Error al crear producto:", err);
    res.status(500).json({ error: "Error interno al crear producto" });
  } finally {
    client.release();
  }
});

// 2. EDITAR PRODUCTO EXISTENTE (PUT)
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_base, id_categoria, imagen_url, tipo_venta, stock, requesterId } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Actualizar datos básicos del producto
    await client.query(
      `UPDATE productos 
       SET nombre = $1, precio_base = $2, id_categoria = $3, imagen_url = $4, tipo_venta = $5 
       WHERE id_producto = $6`,
      [nombre, precio_base, id_categoria, imagen_url, tipo_venta, id]
    );

    // Actualizar el stock en la tabla de variantes (buscamos la primera variante de este producto)
    await client.query(
      `UPDATE inventario_variantes SET stock = $1 WHERE id_producto = $2`,
      [stock || 0, id]
    );

    await client.query('COMMIT');
    
    if (requesterId) await registrarAuditoria(requesterId, 'EDITAR_PRODUCTO', `Producto modificado ID: ${id}`);
    
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error al editar producto:", err);
    res.status(500).json({ error: "Error interno al actualizar producto" });
  } finally {
    client.release();
  }
});

// 3. CAMBIAR ESTADO (HABILITAR / INHABILITAR)
app.put('/api/productos/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo, requesterId } = req.body;
  try {
    await pool.query('UPDATE productos SET activo = $1 WHERE id_producto = $2', [activo, id]);
    
    if (requesterId) {
      const accion = activo ? 'HABILITAR_PRODUCTO' : 'INHABILITAR_PRODUCTO';
      await registrarAuditoria(requesterId, accion, `Producto ID: ${id}`);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    res.status(500).json({ error: "Error al cambiar estado del producto" });
  }
});

// ✅ NUEVO: RUTA DE CATEGORÍAS PARA EL FORMULARIO DE ADMIN
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_categoria, nombre FROM categorias ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener categorías:", err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// ==========================================
// RUTA DE PEDIDOS Y VENTAS 🛒
// ==========================================

// ✅ NUEVO: RUTA PARA VER TODAS LAS VENTAS EN EL PANEL DE AUDITORÍA
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_pedido, total, estado, fecha_pedido, envio_nombre_completo 
      FROM pedidos 
      ORDER BY fecha_pedido DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener todos los pedidos:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { 
    id_usuario, total, items, datos_envio,
    subtotal_original, porcentaje_descuento, dinero_descontado, costo_envio 
  } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. CREAR EL PEDIDO CON DESGLOSE
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (
        id_usuario, total, estado, 
        envio_nombre_completo, envio_direccion, envio_ciudad, envio_departamento,
        subtotal_original, porcentaje_descuento, dinero_descontado, costo_envio
      ) VALUES ($1, $2, 'Completado', $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id_pedido`,
      [
        id_usuario === 'guest' ? null : id_usuario, 
        total, 
        datos_envio?.nombre,
        datos_envio?.direccion,
        datos_envio?.ciudad,
        datos_envio?.codigoPostal,
        subtotal_original,
        porcentaje_descuento,
        dinero_descontado,
        costo_envio
      ]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    // 2. GUARDAR DETALLES Y DESCONTAR STOCK
    for (let item of items) {
      const resProd = await client.query(
        'SELECT v.id_variante, v.stock, p.tipo_venta FROM productos p JOIN inventario_variantes v ON p.id_producto = v.id_producto WHERE p.id_producto = $1 LIMIT 1',
        [item.id_producto]
      );

      if (resProd.rows.length > 0) {
        const prod = resProd.rows[0];
        if (prod.tipo_venta === 'prefabricado') {
          await client.query('UPDATE inventario_variantes SET stock = stock - $1 WHERE id_variante = $2', [item.cantidad, prod.id_variante]);
        }
        await client.query(
          'INSERT INTO detalle_pedidos (id_pedido, id_variante, cantidad, precio_unitario_historico, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [id_pedido, prod.id_variante, item.cantidad, item.precio_base, (item.cantidad * item.precio_base)]
        );
      }
    }
    
    await client.query('COMMIT');
    if (id_usuario !== 'guest') await registrarAuditoria(id_usuario, 'COMPRA_EXITOSA', `Pedido ID: ${id_pedido}`);
    res.json({ success: true, id_pedido });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// HISTORIAL DE COMPRAS (CON DESGLOSE)
// ==========================================
app.get('/api/pedidos/usuario/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        p.id_pedido, p.total, p.estado, p.fecha_pedido AS created_at,
        p.subtotal_original, p.porcentaje_descuento, p.dinero_descontado, p.costo_envio,
        json_agg(json_build_object(
          'nombre', prod.nombre, 'cantidad', dp.cantidad, 
          'precio', dp.precio_unitario_historico, 'imagen_url', prod.imagen_url
        )) as items
      FROM pedidos p
      JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
      JOIN inventario_variantes iv ON dp.id_variante = iv.id_variante
      JOIN productos prod ON iv.id_producto = prod.id_producto
      WHERE p.id_usuario = $1 GROUP BY p.id_pedido ORDER BY p.fecha_pedido DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// ==========================================
// USUARIOS Y AUDITORÍA
// ==========================================
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol, activo FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});



// ==========================================
// EDITAR USUARIO Y CAMBIAR ESTADO (PUT)
// ==========================================

// 1. EDITAR USUARIO
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, requesterId } = req.body;
  
  try {
    // Actualizamos los datos básicos y el rol
    await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id_usuario = $4',
      [nombre, email, rol, id]
    );
    
    // Registramos la acción en la auditoría
    if (requesterId) {
      await registrarAuditoria(requesterId, 'EDITAR_USUARIO', `Usuario modificado ID: ${id} - Nuevo Rol: ${rol}`);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error al editar usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// 2. CAMBIAR ESTADO (HABILITAR / INHABILITAR / DESBLOQUEAR)
app.put('/api/usuarios/:id/estado', async (req, res) => {
  const { id } = req.params;
  const { activo, requesterId } = req.body;
  
  try {
    // Si se está habilitando (activo = true), también reseteamos los intentos fallidos a 0
    // por si la cuenta estaba bloqueada por intentos de contraseña
    if (activo) {
      await pool.query(
        'UPDATE usuarios SET activo = true, intentos_fallidos = 0 WHERE id_usuario = $1',
        [id]
      );
    } else {
      await pool.query(
        'UPDATE usuarios SET activo = false WHERE id_usuario = $1',
        [id]
      );
    }
    
    if (requesterId) {
      const accion = activo ? 'HABILITAR_USUARIO' : 'INHABILITAR_USUARIO';
      await registrarAuditoria(requesterId, accion, `Usuario ID: ${id}`);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error al cambiar estado del usuario:", err);
    res.status(500).json({ error: "Error al cambiar estado del usuario" });
  }
});

// ✅ NUEVO: RUTA DE AUDITORÍA PARA VER LOS LOGS EN EL PANEL
app.get('/api/auditoria', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id_log, l.fecha, u.nombre as autor, u.email as autor_email, l.accion, l.detalles 
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
      ORDER BY l.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener auditoría:", err);
    res.status(500).json({ error: "Error al obtener registros de auditoría" });
  }
});

// 3. CREAR NUEVO USUARIO DESDE EL PANEL ADMIN (POST)
app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, password, rol, requesterId } = req.body;
  
  try {
    // 1. Verificar si el correo ya existe para evitar duplicados
    const userExists = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Este correo ya está registrado en el sistema." });
    }

    // 2. Encriptar la contraseña por seguridad
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Insertar el usuario con el rol que eligió el administrador
    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol, activo, intentos_fallidos) VALUES ($1, $2, $3, $4, true, 0) RETURNING id_usuario",
      [nombre, email, hashedPassword, rol || 'cliente']
    );
    
    const nuevoId = result.rows[0].id_usuario;

    // 4. Registrar la acción en la tabla de auditoría
    if (requesterId) {
      await registrarAuditoria(requesterId, 'CREAR_USUARIO', `Nuevo usuario creado ID: ${nuevoId} con Rol: ${rol}`);
    }

    res.status(201).json({ success: true, id_usuario: nuevoId });
  } catch (err) {
    console.error("Error al crear usuario desde el panel:", err);
    res.status(500).json({ error: "Error interno al crear el usuario." });
  }
});

// 4. RESETEAR CONTRASEÑA DE USUARIO DESDE ADMIN (PUT)
app.put('/api/usuarios/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  
  // 🔥 TRUCO: Aceptamos 'newPassword' o 'password', dependiendo de cómo lo envíe tu React
  const laNuevaContrasena = req.body.newPassword || req.body.password;
  const { requesterId } = req.body;

  // Si después de revisar ambos nombres sigue vacía, rechazamos
  if (!laNuevaContrasena) {
    return res.status(400).json({ error: "La nueva contraseña es obligatoria o el frontend no la está enviando." });
  }

  try {
    // 1. Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(laNuevaContrasena, SALT_ROUNDS);

    // 2. Actualizar la base de datos y resetear los intentos fallidos
    await pool.query(
      'UPDATE usuarios SET password_hash = $1, intentos_fallidos = 0, activo = true WHERE id_usuario = $2',
      [hashedPassword, id]
    );

    // 3. Registrar en auditoría
    if (requesterId) {
      await registrarAuditoria(requesterId, 'RESET_PASSWORD', `Contraseña reseteada por administrador para el usuario ID: ${id}`);
    }

    res.json({ success: true, message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("Error al resetear contraseña:", err);
    res.status(500).json({ error: "Error al resetear la contraseña del usuario." });
  }
});

// ==========================================
// USUARIO CAMBIA SU PROPIA CONTRASEÑA (PUT)
// ==========================================
app.put('/api/usuarios/:id/cambiar-password', async (req, res) => {
  const { id } = req.params;
  
  // 🔥 Aceptamos varios nombres de variables por si tu frontend los llama diferente
  const passwordActual = req.body.passwordActual || req.body.currentPassword;
  const nuevoPassword = req.body.nuevoPassword || req.body.newPassword;

  if (!passwordActual || !nuevoPassword) {
    return res.status(400).json({ error: "Debes proporcionar tu contraseña actual y la nueva." });
  }

  try {
    // 1. Buscar al usuario en la base de datos para obtener su contraseña encriptada actual
    const result = await pool.query('SELECT password_hash FROM usuarios WHERE id_usuario = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const usuario = result.rows[0];

    // 2. Comprobar si la contraseña actual que escribió coincide con la de la base de datos
    const match = await bcrypt.compare(passwordActual, usuario.password_hash);
    
    if (!match) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta." });
    }

    // 3. Si es correcta, encriptamos la NUEVA contraseña
    const hashedNewPassword = await bcrypt.hash(nuevoPassword, SALT_ROUNDS);

    // 4. Guardamos la nueva contraseña en la base de datos
    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2',
      [hashedNewPassword, id]
    );

    // 5. Registramos en la auditoría que el usuario cambió su propia clave
    await registrarAuditoria(id, 'CAMBIO_PASSWORD', `El usuario ID: ${id} cambió su propia contraseña.`);

    res.json({ success: true, message: "Contraseña actualizada exitosamente." });
  } catch (err) {
    console.error("Error al cambiar contraseña:", err);
    res.status(500).json({ error: "Error interno al cambiar la contraseña." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});