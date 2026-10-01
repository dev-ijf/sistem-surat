const fs = require('fs');
const path = require('path');

const route = `app.get('/api/surat/preview-template/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await pool.query('SELECT * FROM surat WHERE id = $1', [id]);
    const surat = rows.rows ? rows.rows[0] : rows[0];
    if (!surat || !surat.filesuratname) {
      return res.status(404).json({ message: 'Template tidak ditemukan' });
    }

    const templateKop = surat.filesuratname;
    const dirsToTry = [
      path.join(__dirname, 'templates', templateKop),
      path.join(process.cwd(), 'api/templates', templateKop)
    ];

    let templatePath = null;
    for (const tPath of dirsToTry) {
      if (fs.existsSync(tPath)) {
        templatePath = tPath;
        break;
      }
    }

    if (templatePath) {
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
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
      const generatedFilename = 'Surat-' + Date.now() + '.docx';
      
      res.setHeader('Content-Disposition', 'inline; filename="' + generatedFilename + '"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      return res.send(buf);
    } else {
      return res.status(404).json({ message: 'File template fisik tidak ditemukan di server.' });
    }
  } catch (err) {
    console.error('GET /api/surat/preview-template/:id error', err);
    res.status(500).json({ message: 'Gagal men-generate template preview.' });
  }
});

`;

for (const file of ['frontend/api/index.js', 'api/index.js']) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  if (code.includes('/api/surat/preview-template/:id')) continue;
  
  code = code.replace('let databaseInitialized = false;', route + 'let databaseInitialized = false;');
  fs.writeFileSync(file, code);
}
