const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const { imageUpload } = require('../../config/multer/image.config');
const { generateVariants } = require('../../utils/processors/image/variants');

const ApiError = require('../../utils/ApiError');

const upload = multer(imageUpload()).single('avatar');
const outputDir = path.join(process.cwd(), 'uploads/avatars');

const imageUploadHandler = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      let statusCode = 400;
      if (typeof err.code === 'string') {
        // Handle specific multer errors if needed
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
          case 'LIMIT_UNEXPECTED_FILE':
            statusCode = 400;
            break;
          default:
            statusCode = 500;
        }
      }

      return next(new ApiError(err.message, statusCode));
    }
    if (!req.file) return next(new ApiError('No image uploaded', 400));

    try {
      await fs.ensureDir(outputDir);

      const filename = `${Date.now()}_${req.file.originalname.split('.')[0]}.webp`;

      const variants = [
        { width: 800, height: 600, suffix: '-md', quality: 75 }, // Medium
        { width: 300, height: 300, suffix: '-thumb', quality: 60 }, // Thumbnail
      ];

      const generated = await generateVariants(
        req.file.buffer,
        filename,
        outputDir,
        variants
      );

      req.imageInfo = {
        filename,
        url: `/uploads/avatars/${filename}`,
        variants: generated,
        originalName: req.file.originalname,
      };

      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = imageUploadHandler;
