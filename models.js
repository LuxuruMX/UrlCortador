require('dotenv').config();


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



// Crea las en bases de datos
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

function generateShortUrl() {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6);
}

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}





// Esta uncion simula que viene de mexico, mas no da el de otro pais fuera de mexico
function getCountryFromIP(ip) {
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168')) {
    return 'mx';
  }
  return 'us';
}

function parseDomainInfo(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;
    
    const domainParts = domain.split('.');
    const tld = domainParts[domainParts.length - 1];
    
    return { domain, path, tld };
  } catch (error) {
    throw new Error('URL inválida');
  }
}

async function calculatePrice(url, userIP, userId) {
  const { domain, path, tld } = parseDomainInfo(url);
  const userCountry = getCountryFromIP(userIP);

  let price = 0.50;

  if (domain.length > 11) {
    const extraChars = domain.length - 11;
    price += extraChars * 0.01;
  }

  const pathWithoutSlash = path.substring(1);
  if (pathWithoutSlash.length > 11) {
    const extraPathChars = pathWithoutSlash.length - 11;
    price += extraPathChars * 0.09;
  }

  if (userCountry === tld) {
    const [rows] = await db.execute('SELECT count FROM user_url_counts WHERE usuario = ?', [userId]);
    const currentCount = rows.length > 0 ? rows[0].count : 0;

    if (currentCount < 4) {
      price *= 0.5;
    } else {
      price *= 0.9;
    }
  }

  return Math.round(price);
}






async function createShortUrl(usuario, originalUrl, userIP) {
  parseDomainInfo(originalUrl);

  let shortUrl;
  let existing = true;
  while (existing) {
    shortUrl = generateShortUrl();
    const [rows] = await db.execute('SELECT 1 FROM urls WHERE shortUrl = ?', [shortUrl]);
    existing = rows.length > 0;
  }

  const price = await calculatePrice(originalUrl, userIP, usuario);

  let token;
  const [tokenRows] = await db.execute('SELECT token FROM user_tokens WHERE usuario = ?', [usuario]);
  if (tokenRows.length === 0) {
    token = generateToken();
    await db.execute('INSERT INTO user_tokens (usuario, token) VALUES (?, ?)', [usuario, token]);
  } else {
    token = tokenRows[0].token;
  }

  await db.execute(
    'INSERT INTO urls (shortUrl, originalUrl, usuario, token) VALUES (?, ?, ?, ?)',
    [shortUrl, originalUrl, usuario, token]
  );

  await db.execute(`
    INSERT INTO user_url_counts (usuario, count) VALUES (?, 1)
    ON DUPLICATE KEY UPDATE count = count + 1`,
    [usuario]
  );

  await db.execute(`
    INSERT INTO user_costs (usuario, total_cost) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE total_cost = total_cost + ?`,
    [usuario, price, price]
  );

  return { shortUrl, token, precio: price };
}







module.exports = {
  db,
  createShortUrl,
  parseDomainInfo,
  getCountryFromIP
};