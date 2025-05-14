// multer.config.js
const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { v4: uuidv4 } = require('uuid');

const sanitizeFilename = (name) =>
  name.replace(/[^a-zA-Z0-9-_.]/g, '_').replace(/\s+/g, '_');

const storage = multer.memoryStorage();

const fileFilter = (allowedMimeTypes) => (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new ApiError(
        `Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}`,
        400,
        {
          receivedType: file.mimetype,
          originalName: file.originalname,
        }
      ),
      false
    );
  }
  cb(null, true);
};

exports.createUploader = ({ fieldName, allowedMimeTypes, maxSize }) => {
  return multer({
    storage,
    fileFilter: fileFilter(allowedMimeTypes),
    limits: { fileSize: maxSize },
    onError: (err) => {
      throw new ApiError(`Upload stream failed: ${err.message}`, 500);
    },
  }).single(fieldName);
};