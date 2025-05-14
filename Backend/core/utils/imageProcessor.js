const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const ApiError = require('../utils/ApiError');

// WebP configuration (optimized for avatars)
const WEBP_CONFIG = {
  quality: 85, // Balanced quality/size
  alphaQuality: 90, // Preserves transparency
  lossless: false, // Faster than lossless
  effort: 4, // Optimal compression
};

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
          withoutEnlargement: true,
        })
        .sharpen({ sigma: 1.2 })
        .webp(WEBP_CONFIG)
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
  // await exports.safeWrite(buffer, originalPath); (uncomment if needed)

  // Generate variants (example: thumbnail + medium size)
  const variants = await exports.generateVariants(buffer, filename, outputDir, [
    { width: 100, height: 100, suffix: '_thumb' }, // Thumbnail
    { width: 400, height: 400, suffix: '_medium' }, // Medium (optional)
    // { width: 800, height: 800, suffix: '_large' }, // Retina/2x (uncomment if needed)
  ]);

  return {
    url: variants.find((v) => v.suffix === '_medium')?.url || variants[0].url,
    variants,
  };
};
