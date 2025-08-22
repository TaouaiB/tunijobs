const fs = require('fs').promises;
const ApiError = require('../ApiError');

let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (err) {
  // Fallback stub when pdf-parse is unavailable
  pdfParse = async () => ({ text: '' });
}

/**
 * Extract text from a PDF file or buffer
 * @param {string|Buffer} filePathOrBuffer - Path to PDF or a Buffer
 * @returns {Promise<string>} extracted text
 */
const extractText = asyncHandler(async (filePathOrBuffer) => {
  let buffer;

  // If input is already a Buffer
  if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else {
    // Read file from disk
    try {
      buffer = await fs.readFile(filePathOrBuffer);
    } catch (err) {
      throw new ApiError('Failed to read PDF file', 400);
    }
  }

  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    throw new ApiError('Failed to parse PDF', 500);
  }
});

/**
 * Clean extracted text (optional)
 * Removes blank lines and extra spaces
 */
const cleanText = (rawText) => {
  if (!rawText) return '';
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
};

// ---------------------------
// asyncHandler wrapper
// ---------------------------
function asyncHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      throw err; // propagate to your global error handler
    }
  };
}

module.exports = { extractText, cleanText };
