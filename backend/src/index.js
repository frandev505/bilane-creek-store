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
  res.json({ mensaje: "API de Bilane Creek lista " });
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

// 4. RUTA PARA ELIMINAR UN PRODUCTO (BAJA)
app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM productos WHERE id_producto = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    res.json({ success: true, mensaje: "Producto eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar el producto" });
  }
});

// 5. RUTA PARA OBTENER LAS CATEGORÍAS (Para el formulario)
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_categoria, nombre FROM categorias WHERE is_active = TRUE');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// 6. RUTA PARA CREAR UN PRODUCTO (ALTA)
app.post('/api/productos', async (req, res) => {
  const { nombre, id_categoria, precio_base } = req.body;
  
  try {
    // Insertamos el nuevo producto y pedimos que nos devuelva el registro creado (RETURNING *)
    const result = await pool.query(
      'INSERT INTO productos (nombre, id_categoria, precio_base) VALUES ($1, $2, $3) RETURNING *',
      [nombre, id_categoria, precio_base]
    );
    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear el producto" });
  }
});

// 7. RUTA PARA ACTUALIZAR UN PRODUCTO (CAMBIOS)
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_base, id_categoria } = req.body;

  try {
    const result = await pool.query(
      'UPDATE productos SET nombre = $1, precio_base = $2, id_categoria = $3, updated_at = CURRENT_TIMESTAMP WHERE id_producto = $4 RETURNING *',
      [nombre, precio_base, id_categoria, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ success: true, producto: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar el producto" });
  }
});

// 8. RUTA PARA PROCESAR EL PAGO (CREAR PEDIDO Y DETALLES)
app.post('/api/pedidos', async (req, res) => {
  const { id_usuario, total, items } = req.body;
  
  // Usamos un "cliente" específico de la piscina para hacer una Transacción
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Iniciamos la transacción de seguridad

    // 1. Insertamos el registro general en la tabla "pedidos"
    const pedidoResult = await client.query(
      "INSERT INTO pedidos (id_usuario, total, estado) VALUES ($1, $2, 'Completado') RETURNING id_pedido",
      [id_usuario, total]
    );
    const id_pedido = pedidoResult.rows[0].id_pedido;

   // 2. Insertamos cada producto del carrito en "detalle_pedidos"
    for (let item of items) {
      // Calculamos el subtotal que nos exige la base de datos
      const subtotal = item.cantidad * item.precio_base;

      await client.query(
        'INSERT INTO detalle_pedidos (id_pedido, id_variante, cantidad, precio_unitario_historico, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [
          id_pedido, 
          item.id_producto,  // Enviamos el ID del producto hacia la columna id_variante
          item.cantidad, 
          item.precio_base,  // Este es el precio_unitario_historico
          subtotal           // El total por ese producto
        ]
      );
    }

    await client.query('COMMIT'); // Si todo salió bien, guardamos permanentemente
    res.json({ success: true, id_pedido: id_pedido, mensaje: "Pago procesado con éxito" });
    
  } catch (err) {
    await client.query('ROLLBACK'); // Si algo falla, deshacemos todo para evitar errores en la DB
    console.error("Error en la transacción del pedido:", err);
    res.status(500).json({ error: "Error al procesar el pago" });
  } finally {
    client.release(); // Soltamos el cliente
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});