const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
require('dotenv').config();

// <-- NOVEDAD: STRIPE 1. Importamos las rutas de pago
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
    if (id_usuario) {
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
// NUEVO: MIDDLEWARE DE SEGURIDAD (AUDITOR) 🛡️
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

// <-- NOVEDAD: STRIPE 2. Le decimos a Express que use las rutas
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
         return res.status(403).json({ error: "Cuenta bloqueada por múltiples intentos fallidos. Contacte a un administrador o gerente para resetear su contraseña." });
      }
      return res.status(403).json({ error: "Tu cuenta está inhabilitada. Contacte a un administrador." });
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
      const intentosActuales = usuario.intentos_fallidos || 0;
      const nuevosIntentos = intentosActuales + 1;

      if (nuevosIntentos >= 3) {
        await pool.query(
          'UPDATE usuarios SET intentos_fallidos = $1, activo = false WHERE id_usuario = $2',
          [nuevosIntentos, usuario.id_usuario]
        );
        return res.status(401).json({ error: "Has superado los 3 intentos fallidos. Tu cuenta ha sido bloqueada por seguridad." });
      } else {
        await pool.query(
          'UPDATE usuarios SET intentos_fallidos = $1 WHERE id_usuario = $2',
          [nuevosIntentos, usuario.id_usuario]
        );
        const intentosRestantes = 3 - nuevosIntentos;
        return res.status(401).json({ error: `Contraseña incorrecta. Te quedan ${intentosRestantes} intento(s).` });
      }
    }
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error en el servidor al intentar iniciar sesión" });
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
    res.status(201).json({ success: true, mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error interno al crear la cuenta" });
  }
});

// ==========================================
// RUTAS PARA PRODUCTOS Y CATEGORÍAS
// ==========================================

app.get('/api/productos', async (req, res) => {
  const { admin } = req.query;
  try {
    const query = admin 
      ? `SELECT p.id_producto, p.nombre, p.precio_base, p.imagen_url, p.activo, c.nombre as categoria, p.id_categoria 
         FROM productos p JOIN categorias c ON p.id_categoria = c.id_categoria ORDER BY p.created_at DESC`
      : `SELECT p.id_producto, p.nombre, p.precio_base, p.imagen_url, c.nombre as categoria 
         FROM productos p JOIN categorias c ON p.id_categoria = c.id_categoria WHERE p.activo = true ORDER BY p.created_at DESC`;
         
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_categoria, nombre FROM categorias WHERE is_active = TRUE');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

app.post('/api/productos', bloquearAuditor, async (req, res) => {
  const { nombre, id_categoria, precio_base, imagen_url, requesterId } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, id_categoria, precio_base, imagen_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, id_categoria, precio_base, imagen_url]
    );
    await registrarAuditoria(requesterId, 'CREAR_PRODUCTO', `Creó el producto: ${nombre}`);
    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

app.put('/api/productos/:id', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_base, id_categoria, imagen_url, requesterId } = req.body;
  try {
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, precio_base = $2, id_categoria = $3, imagen_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id_producto = $5 RETURNING *',
      [nombre, precio_base, id_categoria, imagen_url, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    await registrarAuditoria(requesterId, 'EDITAR_PRODUCTO', `Editó el producto ID: ${id} (${nombre})`);
    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

app.put('/api/productos/:id/estado', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  const { activo, requesterId } = req.body; 
  try {
    await pool.query('UPDATE productos SET activo = $1 WHERE id_producto = $2', [activo, id]);
    const accionTxt = activo ? 'Habilitó' : 'Inhabilitó';
    await registrarAuditoria(requesterId, 'ESTADO_PRODUCTO', `${accionTxt} el producto ID: ${id}`);
    res.json({ success: true, mensaje: "Estado de producto actualizado" });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar estado" });
  }
});

app.delete('/api/productos/:id', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE productos SET activo = false WHERE id_producto = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ success: true, mensaje: "Producto archivado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

// ==========================================
// RUTA DE PEDIDOS (NUEVA IMPLEMENTACIÓN)
// ==========================================
app.post('/api/pedidos', async (req, res) => {
  const { id_usuario, total, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Crear el pedido
    const pedidoResult = await client.query(
      "INSERT INTO pedidos (id_usuario, total, estado) VALUES ($1, $2, 'Completado') RETURNING id_pedido",
      [id_usuario, total]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    // 2. Guardar los detalles del pedido
    for (let item of items) {
      const subtotal = item.cantidad * item.precio_base;
      
      // BUSCAR O CREAR UNA VARIANTE PARA ESTE PRODUCTO
      let id_variante_a_usar;
      
      // Buscar si el producto ya tiene alguna variante
      const varianteExistente = await client.query(
        'SELECT id_variante FROM inventario_variantes WHERE id_producto = $1 LIMIT 1',
        [item.id_producto]
      );

      if (varianteExistente.rows.length > 0) {
        id_variante_a_usar = varianteExistente.rows[0].id_variante;
      } else {
        // Si no tiene variante, le creamos una variante estándar automáticamente
        const nuevaVariante = await client.query(
          "INSERT INTO inventario_variantes (id_producto, talla, color, stock) VALUES ($1, 'Única', 'Único', 100) RETURNING id_variante",
          [item.id_producto]
        );
        id_variante_a_usar = nuevaVariante.rows[0].id_variante;
      }

      // Ahora sí, guardamos el detalle del pedido usando el id_variante correcto
      await client.query(
        'INSERT INTO detalle_pedidos (id_pedido, id_variante, cantidad, precio_unitario_historico, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [id_pedido, id_variante_a_usar, item.cantidad, item.precio_base, subtotal]
      );
    }
    
    await client.query('COMMIT');
    res.json({ success: true, id_pedido: id_pedido, mensaje: "Pago procesado con éxito" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error gigante guardando el pedido:", err);
    res.status(500).json({ error: "Error al procesar el pago" });
  } finally {
    client.release();
  }
});

// ==========================================
// RUTA: HISTORIAL DE COMPRAS DEL USUARIO
// ==========================================
app.get('/api/pedidos/usuario/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT p.id_pedido, p.total, p.estado, p.fecha_pedido AS created_at,
             json_agg(json_build_object(
               'nombre', prod.nombre, 
               'cantidad', dp.cantidad, 
               'precio', dp.precio_unitario_historico, 
               'imagen_url', prod.imagen_url,
               'talla', iv.talla,
               'color', iv.color
             )) as items
      FROM pedidos p
      JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
      JOIN inventario_variantes iv ON dp.id_variante = iv.id_variante
      JOIN productos prod ON iv.id_producto = prod.id_producto
      WHERE p.id_usuario = $1
      GROUP BY p.id_pedido
      ORDER BY p.fecha_pedido DESC
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ error: "Error al obtener el historial de compras" });
  }
});

// ==========================================
// RUTAS PARA GESTIÓN DE USUARIOS (ADMIN)
// ==========================================

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol, activo FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.post('/api/usuarios', bloquearAuditor, async (req, res) => {
  const { nombre, email, password, rol, requesterId } = req.body;
  try {
    const userExists = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, activo, intentos_fallidos) VALUES ($1, $2, $3, $4, true, 0) RETURNING id_usuario, nombre, email, rol',
      [nombre, email, hashedPassword, rol]
    );
    await registrarAuditoria(requesterId, 'CREAR_USUARIO', `Creó un nuevo usuario: ${email} con rol ${rol}`);
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

app.put('/api/usuarios/:id', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, requesterId } = req.body;
  
  try {
    if (rol !== 'admin') {
      const userToChange = await pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [id]);
      if (userToChange.rows.length > 0 && userToChange.rows[0].rol === 'admin') {
        const adminCount = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = true");
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({ error: "Operación denegada: Debe existir al menos un administrador." });
        }
      }
    }

    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id_usuario = $4 RETURNING id_usuario, nombre, email, rol',
      [nombre, email, rol, id]
    );
    await registrarAuditoria(requesterId, 'EDITAR_USUARIO', `Editó la información del usuario ID: ${id} (${email})`);
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

app.delete('/api/usuarios/:id', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  try {
    const userToDelete = await pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [id]);
    if (userToDelete.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    if (userToDelete.rows[0].rol === 'admin') {
      const adminCount = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = true");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: "Operación denegada: No puedes eliminar al último administrador." });
      }
    }

    await pool.query('UPDATE usuarios SET activo = false WHERE id_usuario = $1', [id]);
    res.json({ success: true, mensaje: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

app.put('/api/usuarios/:id/reset-password', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  const { requesterRole, requesterId } = req.body; 

  if (requesterRole !== 'admin' && requesterRole !== 'gerente') {
    return res.status(403).json({ error: "No tienes permiso para realizar esta acción." });
  }

  try {
    const hashedDefaultPassword = await bcrypt.hash('pass123', SALT_ROUNDS);
    
    await pool.query(
      "UPDATE usuarios SET password_hash = $1, intentos_fallidos = 0, activo = true WHERE id_usuario = $2",
      [hashedDefaultPassword, id]
    );

    await registrarAuditoria(
      requesterId, 
      'RESET_PASSWORD', 
      `Forzó el reseteo de contraseña y desbloqueó la cuenta del usuario con ID: ${id}`
    );

    res.json({ success: true, mensaje: "Contraseña reseteada exitosamente. La cuenta ha sido desbloqueada." });
  } catch (err) {
    console.error("Error al resetear contraseña:", err);
    res.status(500).json({ error: "Error al resetear la contraseña" });
  }
});

app.put('/api/usuarios/:id/cambiar-password', async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);

    await pool.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2",
      [hashedPassword, id] 
    );
    res.json({ success: true, mensaje: "Contraseña actualizada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la contraseña" });
  }
});

app.put('/api/usuarios/:id/estado', bloquearAuditor, async (req, res) => {
  const { id } = req.params;
  const { activo, requesterId } = req.body; 
  try {
    if (activo === false) {
      const userToChange = await pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [id]);
      if (userToChange.rows.length > 0 && userToChange.rows[0].rol === 'admin') {
        const adminCount = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = true");
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({ error: "Operación denegada: No puedes inhabilitar al último administrador." });
        }
      }
    }

    await pool.query('UPDATE usuarios SET activo = $1, intentos_fallidos = 0 WHERE id_usuario = $2', [activo, id]);
    const accionTxt = activo ? 'Habilitó' : 'Inhabilitó';
    await registrarAuditoria(requesterId, 'ESTADO_USUARIO', `${accionTxt} al usuario ID: ${id}`);
    res.json({ success: true, mensaje: "Estado de usuario actualizado" });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar estado" });
  }
});

// ==========================================
// RUTA DE AUDITORÍA
// ==========================================
app.get('/api/auditoria', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.id_log, l.accion, l.detalles, l.fecha, u.nombre as autor, u.email as autor_email
      FROM logs_auditoria l
      LEFT JOIN usuarios u ON l.id_usuario = u.id_usuario
      ORDER BY l.fecha DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los logs de auditoría" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});