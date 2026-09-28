const { Pool } = require('pg');
require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 10,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5433),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistem_surat',
      max: 10,
    };

const pool = new Pool(poolConfig);

const query = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result; 
};

module.exports = {
  pool,
  query
};