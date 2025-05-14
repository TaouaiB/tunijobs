const ApiError = require('../../ApiError');
const { MIME_TYPES } = require('../../../constants/multer.constants');

exports.validateImage = (req, file, cb) => {
  try {
    if (!MIME_TYPES.images.includes(file.mimetype)) {
      throw new ApiError(
        `Invalid image type. Allowed: ${MIME_TYPES.images.join(', ')}`,
        400,
        { receivedType: file.mimetype }
      );
    }

    const ext = file.originalname.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!allowedExts.includes(ext)) {
      throw new ApiError(
        `Invalid file extension. Allowed: ${allowedExts.join(', ')}`,
        400,
        { receivedExt: ext }
      );
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};
