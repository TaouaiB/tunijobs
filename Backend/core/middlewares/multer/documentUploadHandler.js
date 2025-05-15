const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const { documentUpload } = require('../../config/multer/documents.config');
const { storeDocument } = require('../../utils/processors/documents/storage');

const ApiError = require('../../utils/ApiError');

const upload = multer(documentUpload()).single('resumeUrl');

const outputDir = path.join(process.cwd(), 'uploads/documents');

const documentUploadHandler = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      let statusCode = 400;
      if (typeof err.code === 'string') {
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

    if (!req.file) return next(new ApiError('No document uploaded', 400));

    try {
      const { buffer, originalname, mimetype, size } = req.file;
      const saved = await storeDocument(buffer, originalname, outputDir);

      req.documentInfo = {
        ...saved, // path, url, originalName
        mimetype,
        size,
      };

      next();
    } catch (error) {
      next(error);
    }
  });
};
module.exports = documentUploadHandler;
