// uploadMiddleware.js
const path = require('path');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');
const { createUploader } = require('../config/multer.config');
const { processAvatar, cleanupFiles } = require('../utils/imageProcessor');

exports.avatarUploadHandler = (req, res, next) => {
  const upload = createUploader({
    fieldName: 'avatar',
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 3 * 1024 * 1024,
  });

  upload(req, res, async (err) => {
    if (err) {
      return next(
        new ApiError(
          err.code === 'LIMIT_FILE_SIZE' ?
            'File too large (max 3MB)'
          : 'Invalid file type',
          400
        )
      );
    }

    if (!req.file) {
      return next(new ApiError('No avatar file provided', 400));
    }

    try {
      const outputDir = path.join(__dirname, '../../uploads/avatars');
      const filename = `avt_${uuidv4().slice(0, 8)}${path.extname(req.file.originalname)}`;

      // Define your image variants (customize as needed)
      const variants = [
        { width: 100, height: 100, suffix: '_thumb' },
        { width: 300, height: 300, suffix: '_medium' },
      ];

      // Process image WITH variants using safeWrite
      const result = await processAvatar(
        req.file.buffer,
        filename,
        outputDir,
        variants
      );

      req.avatarInfo = {
        filename, // or set to null if unused
        url: result.url,
        variants: result.variants,
      };

      next();
    } catch (error) {
      await cleanupFiles([req.file.path]).catch(console.error);
      next(new ApiError('Avatar processing failed: ' + error.message, 500));
    }
  });
};
