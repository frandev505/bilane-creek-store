const { Pool } = require('pg');
require('dotenv').config();

// Configuramos la conexión usando la URL secreta del .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Probamos la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a la base de datos', err.stack);
  }
  console.log('¡Conectado a la base de datos NeonDB exitosamente! 🐘🚀');
  release();
});

module.exports = pool;