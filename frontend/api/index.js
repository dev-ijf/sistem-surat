require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool, Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sistem_surat';

let pool;

app.use(cors());
app.use(express.json());
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadDir));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const query = async (sql, params = []) => {
  const result = await pool.query(sql, params);
  return result.rows;
};

const mapSuratRow = (row) => {
  if (!row) return row;
  return {
    ...row,
    jenisSurat: row.jenisSurat ?? row.jenissurat,
    tglSurat: row.tglSurat ?? row.tglsurat,
    nomorSurat: row.nomorSurat ?? row.nomorsurat,
    penyimpananFisik: row.penyimpananFisik ?? row.penyimpananfisik,
    fileSuratName: row.fileSuratName ?? row.filesuratname,
    fileSuratPath: row.fileSuratPath ?? row.filesuratpath
  };
};

const createMasterRoutes = (endpoint, table, fields) => {
  app.get(`/api/setting/${endpoint}`, async (req, res) => {
    try {
      const rows = await query(`SELECT * FROM ${table} ORDER BY id`);
      res.json(rows);
    } catch (err) {
      console.error(`GET /api/setting/${endpoint} error`, err);
      res.status(500).json({ message: 'Gagal mengambil data.' });
    }
  });

  app.post(`/api/setting/${endpoint}`, async (req, res) => {
    try {
      const values = fields.map(field => req.body[field] || '');
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const inserted = await pool.query(
        `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(inserted.rows[0]);
    } catch (err) {
      console.error(`POST /api/setting/${endpoint} error`, err);
      res.status(500).json({ message: 'Gagal menyimpan data.' });
    }
  });

  app.put(`/api/setting/${endpoint}/:id`, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      const existing = rows[0];

      if (!existing) {
        return res.status(404).json({ message: 'Data tidak ditemukan' });
      }

      const values = fields.map(field => req.body[field] ?? existing[field]);
      const assignments = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const updated = await pool.query(
        `UPDATE ${table} SET ${assignments} WHERE id = $${fields.length + 1} RETURNING *`,
        [...values, id]
      );
      res.json(updated.rows[0]);
    } catch (err) {
      console.error(`PUT /api/setting/${endpoint}/:id error`, err);
      res.status(500).json({ message: 'Gagal memperbarui data.' });
    }
  });

  app.delete(`/api/setting/${endpoint}/:id`, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const rows = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
      if (!rows[0]) {
        return res.status(404).json({ message: 'Data tidak ditemukan' });
      }
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      res.json({ message: 'Data berhasil dihapus', data: rows[0] });
    } catch (err) {
      console.error(`DELETE /api/setting/${endpoint}/:id error`, err);
      res.status(500).json({ message: 'Gagal menghapus data.' });
    }
  });
};

const initializeDatabase = async () => {
  const adminConfig = {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: 'postgres'
  };
  if (DB_PASSWORD !== '') {
    adminConfig.password = DB_PASSWORD;
  }
/** 
  const adminClient = new Client(adminConfig);
  await adminClient.connect();
  const dbExists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (dbExists.rowCount === 0) {
    await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
  }
  await adminClient.end();
*/
  const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
};

pool = new Pool(poolConfig);

  await query(`CREATE TABLE IF NOT EXISTS jenis_surat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS internal (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(255) DEFAULT ''
  )`);

  await query(`CREATE TABLE IF NOT EXISTS kategori_surat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    deskripsi TEXT
  )`);

  await query(`CREATE TABLE IF NOT EXISTS instansi (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL
  )`);

  await query(`CREATE TABLE IF NOT EXISTS kepada_internal (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL
  )`);

  await query(`CREATE TABLE IF NOT EXISTS surat (
    id SERIAL PRIMARY KEY,
    tujuan VARCHAR(255) DEFAULT '',
    jenisSurat VARCHAR(255) DEFAULT '',
    tglSurat DATE,
    dari VARCHAR(255) DEFAULT '',
    instansi VARCHAR(255) DEFAULT '',
    perihal TEXT,
    kategori VARCHAR(255) DEFAULT 'Biasa',
    nomorSurat VARCHAR(255) DEFAULT '',
    status VARCHAR(100) DEFAULT 'Draft',
    penyimpananFisik VARCHAR(255) DEFAULT '',
    fileSuratName VARCHAR(255) DEFAULT '',
    fileSuratPath VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  const seedIfEmpty = async (table, rows, fields) => {
    const result = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
    const count = Number(result.rows[0].count);
    if (count === 0 && rows.length) {
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      for (const row of rows) {
        const values = fields.map(field => row[field] || '');
        await pool.query(`INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`, values);
      }
    }
  };

  await seedIfEmpty('jenis_surat', [
    { nama: 'Surat Keputusan', deskripsi: 'Surat resmi keputusan' },
    { nama: 'Surat Permohonan', deskripsi: 'Surat permintaan resmi' }
  ], ['nama', 'deskripsi']);

  await seedIfEmpty('internal', [
    { nama: 'Kreativa Global', jabatan: 'Sekolah' },
    { nama: 'AIM', jabatan: 'Lembaga' }
  ], ['nama', 'jabatan']);

  await seedIfEmpty('kategori_surat', [
    { nama: 'Penting', deskripsi: 'Membutuhkan respon segera' },
    { nama: 'Biasa', deskripsi: 'Korespondensi umum' }
  ], ['nama', 'deskripsi']);

  await seedIfEmpty('instansi', [
    { nama: 'IJF' },
    { nama: 'KEN' },
    { nama: 'MEDC' },
    { nama: 'OPS' },
    { nama: 'FIN' }
  ], ['nama']);

  await seedIfEmpty('kepada_internal', [
    { nama: 'Divisi HRD' },
    { nama: 'Divisi Finance' },
    { nama: 'Divisi IT' },
    { nama: 'Divisi Marketing' },
    { nama: 'Divisi Operasional' }
  ], ['nama']);
};

app.get('/', (req, res) => {
  res.send('Backend aktif');
});

app.get(['/api', '/api/health'], (req, res) => {
  res.json({ status: 'ok', message: 'Backend aktif' });
});

app.use('/api', ensureDatabaseInitialized);

app.get('/api/surat', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM surat ORDER BY id DESC');
    res.json(rows.map(mapSuratRow));
  } catch (err) {
    console.error('GET /api/surat error', err);
    res.status(500).json({ message: 'Gagal mengambil data surat.' });
  }
});

createMasterRoutes('jenis', 'jenis_surat', ['nama', 'deskripsi']);
createMasterRoutes('internal', 'internal', ['nama', 'jabatan']);
createMasterRoutes('kategori', 'kategori_surat', ['nama', 'deskripsi']);
createMasterRoutes('instansi', 'instansi', ['nama']);
createMasterRoutes('kepada', 'kepada_internal', ['nama']);

app.post('/api/surat', upload.single('fileSurat'), async (req, res) => {
  try {
    const {
      tujuan = '',
      jenisSurat = '',
      tglSurat = '',
      dari = '',
      perihal = '',
      kategori = 'Biasa',
      nomorSurat = '',
      status = 'Draft',
      instansi = '',
      penyimpananFisik = ''
    } = req.body;

    const fileSuratName = req.file ? req.file.originalname : '';
    const fileSuratPath = req.file ? `/uploads/${req.file.filename}` : '';

    const inserted = await pool.query(
      'INSERT INTO surat (tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath]
    );

    res.status(201).json(mapSuratRow(inserted.rows[0]));
  } catch (err) {
    console.error('POST /api/surat error', err);
    res.status(500).json({ message: 'Gagal menyimpan surat.' });
  }
});

app.put('/api/surat/:id', upload.single('fileSurat'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT * FROM surat WHERE id = $1', [id]);
    const surat = mapSuratRow(rows[0]);
    if (!surat) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }

    const {
      tujuan = surat.tujuan,
      jenisSurat = surat.jenisSurat,
      tglSurat = surat.tglSurat,
      dari = surat.dari,
      perihal = surat.perihal,
      kategori = surat.kategori,
      nomorSurat = surat.nomorSurat,
      status = surat.status,
      instansi = surat.instansi,
      penyimpananFisik = surat.penyimpananFisik
    } = req.body;

    const fileSuratName = req.file ? req.file.originalname : surat.fileSuratName;
    const fileSuratPath = req.file ? `/uploads/${req.file.filename}` : surat.fileSuratPath;

    const updated = await pool.query(
      'UPDATE surat SET tujuan = $1, jenisSurat = $2, tglSurat = $3, dari = $4, instansi = $5, perihal = $6, kategori = $7, nomorSurat = $8, status = $9, penyimpananFisik = $10, fileSuratName = $11, fileSuratPath = $12 WHERE id = $13 RETURNING *',
      [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath, id]
    );

    res.json(mapSuratRow(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/surat/:id error', err);
    res.status(500).json({ message: 'Gagal memperbarui surat.' });
  }
});

app.delete('/api/surat/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT * FROM surat WHERE id = $1', [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'Surat tidak ditemukan' });
    }
    await pool.query('DELETE FROM surat WHERE id = $1', [id]);
    res.json({ message: 'Surat berhasil dihapus', data: mapSuratRow(rows[0]) });
  } catch (err) {
    console.error('DELETE /api/surat/:id error', err);
    res.status(500).json({ message: 'Gagal menghapus surat.' });
  }
});

let databaseInitialized = false;
let databaseInitPromise = null;

async function ensureDatabaseInitialized(req, res, next) {
  try {
    if (!databaseInitialized) {
      if (!databaseInitPromise) {
        databaseInitPromise = initializeDatabase()
          .then(() => {
            databaseInitialized = true;
            console.log("Database initialized");
          })
          .catch((error) => {
            databaseInitPromise = null;
            throw error;
          });
      }

      await databaseInitPromise;
    }
    next();
  } catch (error) {
    console.error("Gagal menginisialisasi database:", error);
    res.status(500).json({
      error: "Gagal menginisialisasi database",
      detail: error.message,
    });
  }
}

module.exports = app;
