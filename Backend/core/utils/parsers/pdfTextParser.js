// Backend/core/utils/parsers/pdfTextParser.js
const fs = require('fs');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  // graceful stub
  pdfParse = async () => ({ text: '' });
}

// Extract text from a PDF path or Buffer.
// IMPORTANT: This should NEVER throw. Return '' on failure.
const extractText = async (filePathOrBuffer) => {
  try {
    let buffer;
    if (Buffer.isBuffer(filePathOrBuffer)) {
      buffer = filePathOrBuffer;
    } else {
      buffer = await fs.promises.readFile(filePathOrBuffer);
    }
    const data = await pdfParse(buffer);
    return data?.text || '';
  } catch (err) {
    console.warn('[PDF] extractText failed:', err?.message || err);
    return ''; // <-- don't throw; keep pipeline alive
  }
};

// Clean extracted text (optional)
const cleanText = (rawText) =>
  String(rawText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');

module.exports = { extractText, cleanText };
