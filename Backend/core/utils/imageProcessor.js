const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Generate multiple image variants (thumbnails)
exports.generateVariants = async (buffer, baseName, outputDir, variants) => {
  await fs.ensureDir(outputDir);

  return Promise.all(
    variants.map(async ({ width, height, suffix }) => {
      const variantName = `${path.basename(baseName, path.extname(baseName))}${suffix}.webp`;
      const outputPath = path.join(outputDir, variantName);

      await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: sharp.strategy.entropy,
        })
        .webp({ quality: 80, alphaQuality: 90 })
        .toFile(outputPath);

      return {
        path: outputPath,
        url: `/uploads/avatars/${variantName}`,
        suffix,
      };
    })
  );
};

// Atomic file write
exports.safeWrite = async (buffer, filePath) => {
  const tempPath = `${filePath}.tmp`;
  await sharp(buffer).toFile(tempPath);
  await fs.rename(tempPath, filePath); // Atomic operation
};

// Cleanup files (throws on error)
exports.cleanupFiles = async (filePaths) => {
  await Promise.all(
    filePaths.map(async (filePath) => {
      if (await fs.pathExists(filePath)) {
        await fs.unlink(filePath);
      }
    })
  );
};

// Main processing function
exports.processAvatar = async (buffer, filename, outputDir) => {
  await fs.ensureDir(outputDir);
  const originalPath = path.join(outputDir, filename);

  // // 1. Save original (atomically)
  // await exports.safeWrite(buffer, originalPath);

  // 1. Generate variants
  const variants = await exports.generateVariants(buffer, filename, outputDir, [
    { width: 100, height: 100, suffix: '_thumb' },
  ]);

  return {
    url: variants.find((v) => v.suffix === '_medium')?.url || variants[0].url,
    variants,
  };
};
