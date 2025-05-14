const multer = require('multer'); 
const ApiError = require('../../utils/ApiError');

module.exports = {
  createBaseConfig: (fileFilter) => ({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      // You can extend this to include virus scanning or other checks
      fileFilter(req, file, cb);
    },
    onError: (err) => {
      throw new ApiError(`Upload failed: ${err.message}`, 500);
    }
  })
};
