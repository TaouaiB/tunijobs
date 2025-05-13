const { createUploader } = require('../config/multer.config');
const { processImage, cleanupFiles } = require('../utils/imageProcessor');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');

// Avatar-specific upload configuration
const uploadAvatar = createUploader({
  fieldName: 'avatar',
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 3 * 1024 * 1024, // 3MB
});

// Avatar processing middleware
const processAvatar = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const outputPath = path.join(__dirname, '../../uploads/avatars');
    const filename = `avatar_${req.params.id}_${Date.now()}.webp`;

    const { path: filePath, url } = await processImage(
      req.file.buffer,
      filename,
      outputPath
    );

    req.avatarInfo = {
      // Standardized property name
      path: filePath,
      url: `/uploads/avatars/${filename}`,
      filename: filename,
    };
    next();
  } catch (err) {
    cleanupFiles([req.file.path]);
    next(new ApiError('Avatar processing failed: ' + err.message, 500));
  }
};

exports.handleAvatarUpload = [uploadAvatar, processAvatar];
