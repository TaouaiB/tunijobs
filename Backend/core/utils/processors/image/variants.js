const path = require('path');
const fs = require('fs-extra');
const { processImage } = require('./optimizer');
const ApiError = require('../../../utils/ApiError');

exports.generateVariants = async (buffer, baseName, outputDir, variants) => {
  await fs.ensureDir(outputDir);

  return Promise.all(
    variants.map(async ({ width, height, suffix, quality = 85 }) => {
      const variantName = `${path.basename(baseName, path.extname(baseName))}${suffix}.webp`;
      const outputPath = path.join(outputDir, variantName);

      const processedBuffer = await processImage(buffer, {
        resize: { width, height, fit: 'cover', position: 'entropy' },
        quality
      });

      await fs.writeFile(outputPath, processedBuffer);

      return {
        path: outputPath,
        url: `/uploads/avatars/${variantName}`,
        suffix
      };
    })
  );
};
