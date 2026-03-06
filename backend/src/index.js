const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Importante para recibir datos JSON del frontend

// Configuración de la base de datos NeonDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 1. RUTA DE PRUEBA
app.get('/', (req, res) => {
  res.json({ mensaje: "API de Bilane Creek lista 🚀" });
});

// 2. RUTA DE LOGIN (La que pidió el profesor)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre, email, rol, password_hash FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    // Validación de contraseña (en texto plano por ahora para la demo)
    if (password === usuario.password_hash) {
      // Si todo está bien, enviamos los datos del usuario incluyendo el ROL
      res.json({
        success: true,
        usuario: {
          id: usuario.id_usuario,
          nombre: usuario.nombre,
          rol: usuario.rol
        }
      });
    } else {
      res.status(401).json({ error: "Contraseña incorrecta" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// 3. RUTA PARA OBTENER TODOS LOS PRODUCTOS
app.get('/api/productos', async (req, res) => {
  try {
    // Traemos el producto y el nombre de su categoría haciendo un JOIN
    const result = await pool.query(`
      SELECT p.id_producto, p.nombre, p.precio_base, c.nombre as categoria 
      FROM productos p
      JOIN categorias c ON p.id_categoria = c.id_categoria
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});