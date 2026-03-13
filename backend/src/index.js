const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.get('/', (req, res) => {
  res.json({ mensaje: "API de Bilane Creek lista" });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol, password_hash FROM usuarios WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    const usuario = result.rows[0];
    if (password === usuario.password_hash) {
      res.json({ success: true, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.rol } });
    } else {
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// MODIFICADO: Ahora traemos imagen_url
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id_producto, p.nombre, p.precio_base, p.imagen_url, c.nombre as categoria 
      FROM productos p
      JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ success: true, mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar el producto" });
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

// MODIFICADO: Ahora insertamos imagen_url
app.post('/api/productos', async (req, res) => {
  const { nombre, id_categoria, precio_base, imagen_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO productos (nombre, id_categoria, precio_base, imagen_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, id_categoria, precio_base, imagen_url]
    );
    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

// MODIFICADO: Ahora actualizamos imagen_url
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_base, id_categoria, imagen_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, precio_base = $2, id_categoria = $3, imagen_url = $4, updated_at = CURRENT_TIMESTAMP WHERE id_producto = $5 RETURNING *',
      [nombre, precio_base, id_categoria, imagen_url, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

app.post('/api/pedidos', async (req, res) => {
  const { id_usuario, total, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pedidoResult = await client.query(
      "INSERT INTO pedidos (id_usuario, total, estado) VALUES ($1, $2, 'Completado') RETURNING id_pedido",
      [id_usuario, total]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

    for (let item of items) {
      const subtotal = item.cantidad * item.precio_base;
      await client.query(
        'INSERT INTO detalle_pedidos (id_pedido, id_variante, cantidad, precio_unitario_historico, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [id_pedido, item.id_producto, item.cantidad, item.precio_base, subtotal]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true, id_pedido: id_pedido, mensaje: "Pago procesado con éxito" });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: "Error al procesar el pago" });
  } finally {
    client.release();
  }
});

app.post('/api/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const userExists = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

    const result = await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'cliente') RETURNING id_usuario, nombre, email, rol",
      [nombre, email, password]
    );
    res.status(201).json({ success: true, mensaje: "Usuario registrado con éxito", usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error interno al crear la cuenta" });
  }
});

// ==========================================
// RUTAS PARA GESTIÓN DE USUARIOS (ADMIN)
// ==========================================

// 1. Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_usuario, nombre, email, rol FROM usuarios ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// 2. Crear un nuevo usuario desde el panel
app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  try {
    const userExists = await pool.query('SELECT email FROM usuarios WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "Este correo ya está registrado" });

    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre, email, rol',
      [nombre, email, password, rol]
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// 3. Actualizar un usuario existente (Nombre, Email, Rol)
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;
  
  try {
    // Protección del último admin
    if (rol !== 'admin') {
      const userToChange = await pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [id]);
      if (userToChange.rows.length > 0 && userToChange.rows[0].rol === 'admin') {
        const adminCount = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'");
        if (parseInt(adminCount.rows[0].count) <= 1) {
          return res.status(400).json({ error: "Operación denegada: Debe existir al menos un administrador." });
        }
      }
    }

    const result = await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2, rol = $3 WHERE id_usuario = $4 RETURNING id_usuario, nombre, email, rol',
      [nombre, email, rol, id]
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar el usuario" });
  }
});

// 4. Eliminar un usuario
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userToDelete = await pool.query("SELECT rol FROM usuarios WHERE id_usuario = $1", [id]);
    if (userToDelete.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

    if (userToDelete.rows[0].rol === 'admin') {
      const adminCount = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'");
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: "Operación denegada: No puedes eliminar al último administrador." });
      }
    }

    await pool.query('DELETE FROM usuarios WHERE id_usuario = $1', [id]);
    res.json({ success: true, mensaje: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// 5. Resetear contraseña de un usuario a 'pass123'
app.put('/api/usuarios/:id/reset-password', async (req, res) => {
  const { id } = req.params;
  const { requesterRole } = req.body;

  // Verificación de seguridad en el backend
  if (requesterRole !== 'admin' && requesterRole !== 'gerente') {
    return res.status(403).json({ error: "No tienes permiso para realizar esta acción." });
  }

  try {
    await pool.query(
      "UPDATE usuarios SET password_hash = 'pass123' WHERE id_usuario = $1",
      [id]
    );
    res.json({ success: true, mensaje: "Contraseña reseteada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al resetear la contraseña" });
  }
});

// 6. Cambiar contraseña por el propio usuario (requiere estar logueado)
app.put('/api/usuarios/:id/cambiar-password', async (req, res) => {
  const { id } = req.params;
  const { nuevaPassword } = req.body;

  try {
    /* NOTA: Si estás usando bcrypt para encriptar contraseñas (muy recomendado), 
      debes hashear la contraseña aquí antes de guardarla, así:
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(nuevaPassword, salt);
      Y usar 'hashedPassword' en el query en lugar de 'nuevaPassword'.
    */

    await pool.query(
      "UPDATE usuarios SET password_hash = $1 WHERE id_usuario = $2",
      [nuevaPassword, id] 
    );
    res.json({ success: true, mensaje: "Contraseña actualizada exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar la contraseña" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});