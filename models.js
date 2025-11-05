const mysql = require('mysql2/promise');
const crypto = require('crypto');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'urlshortener',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection()
  .then(conn => {
    conn.release();
  })
  .catch(err => {
    console.error('MariaDB:', err);
    process.exit(1);
  });


const initDB = async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS urls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shortUrl VARCHAR(10) NOT NULL UNIQUE,
      originalUrl TEXT NOT NULL,
      usuario VARCHAR(255) NOT NULL,
      token VARCHAR(64) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(255) NOT NULL UNIQUE,
      token VARCHAR(64) NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_costs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(255) NOT NULL UNIQUE,
      total_cost DECIMAL(10, 2) DEFAULT 0.00
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_url_counts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario VARCHAR(255) NOT NULL UNIQUE,
      count INT DEFAULT 0
    )
  `);
};





initDB()
  .then(() => console.log('Crear/verificar tablas'))
  .catch(err => console.error('Error:', err));

module.exports = {
  db
};