const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  filename: String,        // uploaded file name
  originalName: String,    // original filename
  targetSize: String,      // selected paper size
  outputName: String,      // output filename
  uploadedAt: { type: Date, default: Date.now } // timestamp
});

module.exports = mongoose.model('PdfLog', pdfSchema);
