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
// RUTA DE PEDIDOS (CON DESCUENTOS Y ENVÍO) 🛒
// ==========================================
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

// ... (Resto de rutas de gestión de usuarios y auditoría se mantienen igual que tu original)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol, activo FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Error" }); }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});