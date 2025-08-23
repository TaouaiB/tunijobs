// Backend/modules/analysis/services/pdfParser.js
const fs = require('fs');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  // graceful stub: returns empty text when pdf-parse isn't installed
  pdfParse = async () => ({ text: '' });
}

async function parsePDF(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(buffer);
  return data?.text || '';
}

module.exports = { parsePDF };
