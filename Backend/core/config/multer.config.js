const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Memory storage (for Sharp processing pipeline)
const storage = multer.memoryStorage();

// File filter factory
const fileFilter = (allowedMimeTypes) => (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        `Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}`,
        400
      ),
      false
    );
  }
};

// Multer instance generator
exports.createUploader = ({ fieldName, allowedMimeTypes, maxSize }) => {
  return multer({
    storage,
    fileFilter: fileFilter(allowedMimeTypes),
    limits: { fileSize: maxSize },
  }).single(fieldName);
};
