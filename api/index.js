require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { Pool, Client } = require('pg');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 5433);
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

const storage = multer.memoryStorage();

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
  const poolConfig = process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
    }
    : {
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      max: 10,
    };

  pool = new Pool(poolConfig);

  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  try {
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'Aktif\'');
  } catch(e) {
    console.error("Error adding status column to users", e);
  }

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

  await query(`CREATE TABLE IF NOT EXISTS kopsurat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) DEFAULT ''
  )`);

  await query(`CREATE TABLE IF NOT EXISTS surat (
    id SERIAL PRIMARY KEY,
    tujuan VARCHAR(255) DEFAULT '',
    jenisSurat VARCHAR(255) DEFAULT '',
    tglSurat DATE,
    dari VARCHAR(255) DEFAULT '',
    instansi VARCHAR(255) DEFAULT '',
    perihal TEXT,    judul VARCHAR(255) DEFAULT '',    kategori VARCHAR(255) DEFAULT 'Biasa',
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

  await seedIfEmpty('users', [
    { email: 'kukies.chocolate@gmail.com', nama: 'Admin', role: 'Admin', status: 'Aktif' }
  ], ['email', 'nama', 'role', 'status']);

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

  await seedIfEmpty('kopsurat', [
    { nama: 'Kop Surat Akademi Insan Mulia.docx' },
    { nama: 'Kop Surat Indonesia Juara.docx' },
    { nama: 'Kop Surat Kreativa Education Network.docx' },
    { nama: 'Kop Surat Kreativa Global School  729 jatisari.docx' },
    { nama: 'Kop Surat Kreativa Global School 668.docx' },
    { nama: 'Kop Surat Kreativa Global School No.39.docx' },
    { nama: 'Kop Surat Kreativa Global School.docx' },
    { nama: 'Kop Surat Kreativa Insan Mulia.docx' },
    { nama: 'Kop Surat Talenta Juara.docx' }
  ], ['nama']);
};

app.get('/', (req, res) => {
  res.send('Backend aktif');
});

app.get(['/api', '/api/health'], (req, res) => {
  res.json({ status: 'ok', message: 'Backend aktif' });
});

app.use('/api', ensureDatabaseInitialized);

const verifyGoogleToken = (accessToken) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.googleapis.com',
            path: '/oauth2/v3/userinfo',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'SistemSurat-App'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (error) { reject(new Error('Gagal membaca data dari Google')); }
                } else {
                    reject(new Error('Token Google tidak valid atau sudah kedaluwarsa'));
                }
            });
        });
        req.on('error', (error) => { reject(new Error('Masalah koneksi ke server Google')); });
        req.end();
    });
};

app.post('/api/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token tidak dikirim oleh frontend!' });
        }

        const payload = await verifyGoogleToken(token);
        const userEmail = payload.email;

        if (!userEmail) {
            return res.status(401).json({ message: 'Akses ditolak: Tidak dapat menemukan email di token ini.' });
        }

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [userEmail]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Akses ditolak: Email belum terdaftar di dalam sistem.' });
        }

        res.status(200).json({
            message: 'Login berhasil!',
            user: {
                email: user.email,
                name: user.nama,
                role: user.role,
                picture: payload.picture,
            },
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

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


app.get('/api/setting/kopsurat', async (req, res) => {
  try {
    const rows = await query('SELECT * FROM kopsurat ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data.' });
  }
});

app.post('/api/setting/kopsurat', upload.single('fileTemplate'), async (req, res) => {
  try {
    let { nama } = req.body;
    if (!nama.toLowerCase().endsWith('.docx')) nama += '.docx';
    
    let filePath = '';
    let fileData = null;
    let fileMime = null;
    if (req.file) {
      filePath = nama;
      fileData = req.file.buffer;
      fileMime = req.file.mimetype;
    }
    
    const inserted = await pool.query(
      'INSERT INTO kopsurat (nama, file_path, file_data, file_mime) VALUES ($1, $2, $3, $4) RETURNING id, nama, file_path',
      [nama, filePath, fileData, fileMime]
    );
    res.json(inserted.rows ? inserted.rows[0] : inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menyimpan data' });
  }
});

app.put('/api/setting/kopsurat/:id', upload.single('fileTemplate'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    let { nama } = req.body;
    if (!nama.toLowerCase().endsWith('.docx')) nama += '.docx';
    
    const existing = await query('SELECT id, nama, file_path FROM kopsurat WHERE id = $1', [id]);
    const ext = existing[0] || (existing.rows && existing.rows[0]);
    let filePath = ext?.file_path || '';
    
    let updated;
    if (req.file) {
      filePath = nama;
      updated = await pool.query(
        'UPDATE kopsurat SET nama = $1, file_path = $2, file_data = $3, file_mime = $4 WHERE id = $5 RETURNING id, nama, file_path',
        [nama, filePath, req.file.buffer, req.file.mimetype, id]
      );
    } else {
      filePath = nama;
      updated = await pool.query(
        'UPDATE kopsurat SET nama = $1, file_path = $2 WHERE id = $3 RETURNING id, nama, file_path',
        [nama, filePath, id]
      );
    }
    res.json(updated.rows ? updated.rows[0] : updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update data' });
  }
});

app.delete('/api/setting/kopsurat/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query('DELETE FROM kopsurat WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal hapus data' });
  }
});

app.get('/api/surat/templates', async (req, res) => {
  try {
    const rows = await query('SELECT nama FROM kopsurat ORDER BY id');
    res.json(rows.map(r => r.nama));
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil templates.' });
  }
});

app.post('/api/surat', upload.single('fileSurat'), async (req, res) => {
  try {
    const {
      tujuan, jenisSurat, tglSurat, dari, perihal, kategori, nomorSurat,
      status, instansi, penyimpananFisik, templateKop
    } = req.body;
    
    let fileSuratName = req.file ? req.file.originalname : (templateKop ? templateKop : '');
    let fileSuratPath = '';
    let fileData = null;
    let fileMime = null;
    
    if (req.file) {
      fileData = req.file.buffer;
      fileMime = req.file.mimetype;
    } else if (templateKop) {
      const kopsuratRows = await pool.query('SELECT file_data FROM kopsurat WHERE nama = $1', [templateKop]);
      const kop = kopsuratRows.rows ? kopsuratRows.rows[0] : kopsuratRows[0];
      if (kop && kop.file_data) {
        const zip = new PizZip(kop.file_data);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '{{', end: '}}' } });
        doc.render({ tujuan, jenisSurat, tglSurat, dari, perihal, kategori, nomorSurat, instansi, judul: req.body.judul });
        fileData = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        fileMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        const cleanName = String(perihal || req.body.judul || 'Surat').replace(/[^a-zA-Z0-9 -]/g, '').trim();
        fileSuratName = cleanName + '.docx';
      }
    }

    const inserted = await pool.query(
      'INSERT INTO surat (tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath, file_data, file_mime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath, fileData, fileMime]
    );
    
    const newId = inserted.rows[0].id;
    if (fileData) {
      const finalPath = `/api/surat/download/${newId}`;
      const updated = await pool.query(
        'UPDATE surat SET filesuratpath = $1 WHERE id = $2 RETURNING *',
        [finalPath, newId]
      );
      return res.status(201).json(mapSuratRow(updated.rows[0]));
    }
    
    res.status(201).json(mapSuratRow(inserted.rows[0]));
  } catch (err) {
    console.error('POST /api/surat error', err);
    res.status(500).json({ message: 'Gagal menyimpan surat.' });
  }
});

app.put('/api/surat/:id', upload.single('fileSurat'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await pool.query('SELECT * FROM surat WHERE id = $1', [id]);
    const surat = mapSuratRow(rows.rows ? rows.rows[0] : rows[0]);
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

    const fileSuratName = req.file ? req.file.originalname : (req.body.templateKop ? req.body.templateKop : surat.fileSuratName);
    
    if (req.file) {
      const finalPath = `/api/surat/download/${id}`;
      const updated = await pool.query(
        'UPDATE surat SET tujuan = $1, jenisSurat = $2, tglSurat = $3, dari = $4, instansi = $5, perihal = $6, kategori = $7, nomorSurat = $8, status = $9, penyimpananFisik = $10, fileSuratName = $11, fileSuratPath = $12, file_data = $13, file_mime = $14 WHERE id = $15 RETURNING *',
        [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, finalPath, req.file.buffer, req.file.mimetype, id]
      );
      return res.json(mapSuratRow(updated.rows ? updated.rows[0] : updated[0]));
    } else {
      const updated = await pool.query(
        'UPDATE surat SET tujuan = $1, jenisSurat = $2, tglSurat = $3, dari = $4, instansi = $5, perihal = $6, kategori = $7, nomorSurat = $8, status = $9, penyimpananFisik = $10, fileSuratName = $11 WHERE id = $12 RETURNING *',
        [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, id]
      );
      return res.json(mapSuratRow(updated.rows ? updated.rows[0] : updated[0]));
    }
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

app.get(['/api/surat/preview-template/:id', '/api/surat/preview-template/:id/:filename'], async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await pool.query('SELECT * FROM surat WHERE id = $1', [id]);
    const surat = rows.rows ? rows.rows[0] : rows[0];
    if (!surat || !surat.filesuratname) {
      return res.status(404).json({ message: 'Template tidak ditemukan' });
    }

    const templateKop = surat.filesuratname;
    const kopsuratRows = await pool.query('SELECT file_data FROM kopsurat WHERE nama = $1', [templateKop]);
    const kop = kopsuratRows.rows ? kopsuratRows.rows[0] : kopsuratRows[0];
    
    if (kop && kop.file_data) {
      const zip = new PizZip(kop.file_data);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '{{', end: '}}' } });
      doc.render({
        tujuan: surat.tujuan,
        jenisSurat: surat.jenissurat,
        tglSurat: surat.tglsurat,
        dari: surat.dari,
        perihal: surat.perihal,
        judul: surat.judul,
        kategori: surat.kategori,
        nomorSurat: surat.nomorsurat,
        instansi: surat.instansi
      });
      
      const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      const cleanName = String(surat.perihal || surat.judul || 'Surat').replace(/[^a-zA-Z0-9 -]/g, '').trim();
      const generatedFilename = cleanName + '.docx';
      
      res.setHeader('Content-Length', buf.length);
      res.setHeader('Content-Disposition', 'inline; filename="' + generatedFilename + '"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      return res.send(buf);
    } else {
      return res.status(404).json({ message: 'File template fisik tidak ditemukan di database.' });
    }
  } catch (err) {
    console.error('GET /api/surat/preview-template/:id error', err);
    res.status(500).json({ message: 'Gagal men-generate template preview.' });
  }
});


app.get('/api/surat/download/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await pool.query('SELECT filesuratname, file_data, file_mime FROM surat WHERE id = $1', [id]);
    const surat = rows.rows ? rows.rows[0] : rows[0];
    if (!surat || !surat.file_data) {
      return res.status(404).json({ message: 'File tidak ditemukan di database.' });
    }
    const filename = surat.filesuratname || 'document';
    const mime = surat.file_mime || 'application/octet-stream';
    res.setHeader('Content-Length', surat.file_data.length);
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Type', mime);
    res.send(surat.file_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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

app.get('/api/test-deploy', (req, res) => res.json({ deployed: true, time: Date.now() }));
app.get('/api/users', async (req, res) => {
  try {
    const rows = await query('SELECT id, nama, email, role, status, created_at FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/users error', err);
    res.status(500).json({ message: 'Gagal mengambil data user.' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { nama, email, role = 'Staff', status = 'Aktif' } = req.body;
    const inserted = await pool.query(
      'INSERT INTO users (nama, email, role, status) VALUES ($1, $2, $3, $4) RETURNING id, nama, email, role, status, created_at',
      [nama, email, role, status]
    );
    res.status(201).json(inserted.rows[0]);
  } catch (err) {
    console.error('POST /api/users error', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email sudah terdaftar.' });
    }
    res.status(500).json({ message: 'Gagal menyimpan user.' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nama, email, role, status } = req.body;

    const rows = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const updated = await pool.query(
      'UPDATE users SET nama = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING id, nama, email, role, status, created_at',
      [nama, email, role, status, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error('PUT /api/users/:id error', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email sudah terdaftar pada user lain.' });
    }
    res.status(500).json({ message: 'Gagal memperbarui user.' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!rows[0]) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User berhasil dihapus', data: rows[0] });
  } catch (err) {
    console.error('DELETE /api/users/:id error', err);
    res.status(500).json({ message: 'Gagal menghapus user.' });
  }
});
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}




