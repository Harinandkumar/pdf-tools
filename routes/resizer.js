const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const router = express.Router();

// Directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const outputDir = path.join(__dirname, '..', 'output');
[uploadsDir, outputDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET Resizer page
router.get('/', (req, res) => res.render('resizer'));

// POST PDF resize
router.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.send('No file uploaded.');

  const target = req.body.target || 'a4';
  const infile = path.join(uploadsDir, req.file.filename);
  const outname = `resized-${Date.now()}.pdf`;
  const outfile = path.join(outputDir, outname);

  const paperMap = { a4: 'a4', a5: 'a5', letter: 'letter', legal: 'legal' };
  const paper = paperMap[target] || 'a4';

  // Ghostscript command detection
  let gsCommand;
  if (process.platform === 'win32') {
    // Default Windows command
    gsCommand = 'gswin64c';
    // Full path fallback
    const fallbackPath = 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe';
    if (fs.existsSync(fallbackPath)) gsCommand = `"${fallbackPath}"`;
  } else {
    gsCommand = 'gs';
  }

  // Ghostscript command with compression
  const cmd = `${gsCommand} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen -dPDFFitPage -sPAPERSIZE=${paper} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outfile}" "${infile}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) return res.render('result', { success: false, message: 'Ghostscript error', error: stderr });

    // Copy result to public downloads
    const publicDir = path.join(__dirname, '..', 'public', 'downloads');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(outfile, path.join(publicDir, outname));

    res.render('result', { success: true, message: 'Resized & compressed successfully', download: `/public/downloads/${outname}` });
  });
});

module.exports = router;
