// const mysql = require('mysql2/promise');
// require('dotenv').config();

// // Create connection pool for better performance
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || 'localhost',
//   port: process.env.DB_PORT || 3306,
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'VinHousing',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0
// });

// // Test connection
// pool.getConnection()
//   .then(connection => {
//     console.log('✅ Database connected successfully');
//     connection.release();
//   })
//   .catch(err => {
//     console.error('❌ Database connection error:', err.message);
//   });

// module.exports = pool;

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'VinHousing',
  port: process.env.DB_PORT || 4000, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ⚠️ CRITICAL CHANGE: TiDB requires secure SSL connections
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

module.exports = pool;