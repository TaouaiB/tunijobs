const fs = require('fs').promises;

async function cleanupFiles(paths) {
  for (const filePath of paths) {
    try {
      await fs.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.warn(`File not found, skipping: ${filePath}`);
      } else {
        console.error(`Error deleting file ${filePath}:`, err);
        throw err;
      }
    }
  }
}

module.exports = cleanupFiles;
