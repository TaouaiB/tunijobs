const ApiError = require('../../ApiError');
const { DOCUMENT_TYPES } = require('../../../constants/multer.constants');

exports.validateDocument = (req, file, cb) => {
  try {
    if (!DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new ApiError(
        `Invalid document type. Allowed: ${DOCUMENT_TYPES.join(', ')}`,
        400,
        { receivedType: file.mimetype }
      );
    }
    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};