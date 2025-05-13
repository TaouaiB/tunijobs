const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

exports.processImage = async (buffer, filename, outputPath) => {
  const optimizedPath = path.join(outputPath, filename);

  await sharp(buffer)
    .resize(500, 500, { 
      fit: 'inside', 
      withoutEnlargement: true 
    })
    .webp({ quality: 80 }) // Modern format, better compression
    .toFile(optimizedPath);

  return {
    path: optimizedPath,
    url: `/uploads/${path.basename(outputPath)}/${filename}`
  };
};

exports.cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, err => {
        if (err) console.error(`Cleanup failed for ${filePath}:`, err);
      });
    }
  });
};