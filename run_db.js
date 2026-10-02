const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Aktif'");
  await pool.query("UPDATE users SET role = 'Admin', status = 'Aktif' WHERE email = 'kukies.chocolate@gmail.com'");
  console.log('User kukies updated to Admin');
  process.exit(0);
}
run();
