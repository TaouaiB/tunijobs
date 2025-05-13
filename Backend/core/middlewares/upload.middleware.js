const { createUploader } = require('../config/multer.config');
const { processImage, cleanupFiles } = require('../utils/imageProcessor');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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
    // Replace manual naming with UUID + original extension
    const originalExt = path.extname(req.file.originalname); // .jpg, .png etc.
    const filename = `avatar_${uuidv4()}${originalExt}`; // Format: "avatar_uuid.ext"

    const { path: filePath, url } = await processImage(
      req.file.buffer,
      filename, // Now "avatar_f47ac10b-58cc-4372-a567-0e02b2c3d479.jpg"
      outputPath
    );

    req.avatarInfo = {
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
