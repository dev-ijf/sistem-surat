require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { exec } = require('child_process');
const { pool } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const convertToPdf = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    // Escape single quotes just in case
    const safeInput = path.resolve(inputPath).replace(/'/g, "''");
    const safeOutput = path.resolve(outputPath).replace(/'/g, "''");
    const psCommand = `$word = New-Object -ComObject Word.Application; $word.Visible = $false; $doc = $word.Documents.Open('${safeInput}'); $doc.SaveAs([ref] '${safeOutput}', [ref] 17); $doc.Close(); $word.Quit();`;

    exec(`powershell -Command "${psCommand}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('PDF Conversion Error:', error);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const app = express();
const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 5433);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'sistem_surat';

app.use(cors());
app.use(express.json());
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);

const uploadDir = path.join(__dirname, 'uploads');
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

  await query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff',
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS surat (
    id SERIAL PRIMARY KEY,
    tujuan VARCHAR(255) DEFAULT '',
    jenisSurat VARCHAR(255) DEFAULT '',
    tglSurat DATE,
    dari VARCHAR(255) DEFAULT '',
    instansi VARCHAR(255) DEFAULT '',
    perihal TEXT,
    judul TEXT,
    kategori VARCHAR(255) DEFAULT 'Biasa',
    nomorSurat VARCHAR(255) DEFAULT '',
    status VARCHAR(100) DEFAULT 'Draft',
    penyimpananFisik VARCHAR(255) DEFAULT '',
    fileSuratName VARCHAR(255) DEFAULT '',
    fileSuratPath VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await query(`CREATE TABLE IF NOT EXISTS kopsurat (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) DEFAULT '',
    instansi VARCHAR(255) DEFAULT ''
  )`);
  try {
    await query(`ALTER TABLE kopsurat ADD COLUMN IF NOT EXISTS instansi VARCHAR(255) DEFAULT ''`);
  } catch (e) {
    console.error('Error adding instansi column to kopsurat', e);
  }

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

  await seedIfEmpty('users', [
    { nama: 'Admin Surat', email: 'kukies.chocolate@gmail.com', role: 'Admin', status: 'Aktif' }
  ], ['nama', 'email', 'role', 'status']);

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

app.get('/api/surat/templates', (req, res) => {
  const templateDir = path.join(__dirname, 'templates');
  if (!fs.existsSync(templateDir)) {
    return res.json([]);
  }
  const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.docx'));
  res.json(files);
});

app.post('/api/surat', upload.single('fileSurat'), async (req, res) => {
  try {
    const {
      tujuan = '',
      jenisSurat = '',
      tglSurat = '',
      dari = '',
      perihal = '',
      judul = '',
      kategori = 'Biasa',
      nomorSurat = '',
      status = 'Draft',
      instansi = '',
      penyimpananFisik = '',
      templateKop = ''
    } = req.body;

    let fileSuratName = req.file ? req.file.originalname : '';
    let fileSuratPath = req.file ? `/uploads/${req.file.filename}` : '';

    if (!req.file && templateKop) {
      try {
        const templatePath = path.join(__dirname, 'templates', templateKop);
        if (fs.existsSync(templatePath)) {
          const content = fs.readFileSync(templatePath, 'binary');
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{{', end: '}}' }
          });

          doc.render({
            tujuan: tujuan,
            jenisSurat: jenisSurat,
            tglSurat: tglSurat,
            dari: dari,
            perihal: perihal,
            judul: judul,
            kategori: kategori,
            nomorSurat: nomorSurat,
            instansi: instansi
          });

          const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
          });

          const generatedFilename = `Surat-${Date.now()}.docx`;
          const generatedPath = path.join(__dirname, 'uploads', generatedFilename);
          fs.writeFileSync(generatedPath, buf);

          fileSuratName = generatedFilename;
          fileSuratPath = `/uploads/${generatedFilename}`;

          // Create PDF preview
          const pdfFilename = generatedFilename.replace('.docx', '.pdf');
          const pdfPath = path.join(__dirname, 'uploads', pdfFilename);
          convertToPdf(generatedPath, pdfPath).catch(console.error);
        }
      } catch (err) {
        console.error('Error generating docx:', err);
      }
    } else if (req.file && req.file.filename.endsWith('.docx')) {
      const pdfFilename = req.file.filename.replace('.docx', '.pdf');
      const pdfPath = path.join(__dirname, 'uploads', pdfFilename);
      convertToPdf(req.file.path, pdfPath).catch(console.error);
    }

    const inserted = await pool.query(
      'INSERT INTO surat (tujuan, jenisSurat, tglSurat, dari, instansi, perihal, judul, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, judul, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath]
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
      judul = surat.judul,
      kategori = surat.kategori,
      nomorSurat = surat.nomorSurat,
      status = surat.status,
      instansi = surat.instansi,
      penyimpananFisik = surat.penyimpananFisik
    } = req.body;

    const fileSuratName = req.file ? req.file.originalname : surat.fileSuratName;
    const fileSuratPath = req.file ? `/uploads/${req.file.filename}` : surat.fileSuratPath;

    if (req.file && req.file.filename.endsWith('.docx')) {
      const pdfFilename = req.file.filename.replace('.docx', '.pdf');
      const pdfPath = path.join(__dirname, 'uploads', pdfFilename);
      convertToPdf(req.file.path, pdfPath).catch(console.error);
    }

    const updated = await pool.query(
      'UPDATE surat SET tujuan = $1, jenisSurat = $2, tglSurat = $3, dari = $4, instansi = $5, perihal = $6, judul = $7, kategori = $8, nomorSurat = $9, status = $10, penyimpananFisik = $11, fileSuratName = $12, fileSuratPath = $13 WHERE id = $14 RETURNING *',
      [tujuan, jenisSurat, tglSurat, dari, instansi, perihal, judul, kategori, nomorSurat, status, penyimpananFisik, fileSuratName, fileSuratPath, id]
    );

    res.json(mapSuratRow(updated.rows[0]));
  } catch (err) {
    console.error('PUT /api/surat/:id error', err);
    res.status(500).json({ message: 'Gagal memperbarui surat.' });
  }
});

app.get('/api/surat/preview/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.endsWith('.pdf')) {
      return res.status(400).send('Only PDF preview is supported');
    }

    const docxFilename = filename.replace('.pdf', '.docx');
    const pdfPath = path.join(__dirname, 'uploads', filename);
    const docxPath = path.join(__dirname, 'uploads', docxFilename);

    // If PDF already exists, send it
    if (fs.existsSync(pdfPath)) {
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
      return res.sendFile(pdfPath);
    }

    // If DOCX exists but no PDF, convert it on the fly
    if (fs.existsSync(docxPath)) {
      try {
        await convertToPdf(docxPath, pdfPath);
        if (fs.existsSync(pdfPath)) {
          res.contentType('application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
          return res.sendFile(pdfPath);
        }
      } catch (e) {
        console.error('On-the-fly PDF conversion failed', e);
      }
    }

    res.status(404).send('File not found');
  } catch (err) {
    console.error('Preview error', err);
    res.status(500).send('Internal Server Error');
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

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menginisialisasi database:', error);
    process.exit(1);
  }
};

startServer();