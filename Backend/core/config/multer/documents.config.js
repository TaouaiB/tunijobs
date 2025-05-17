const { createBaseConfig } = require('./base.config');
const {
  validateDocument,
} = require('../../utils/processors/documents/validator');

module.exports = {
  documentUpload: (maxSize = 10 * 1024 * 1024) => {
    const config = createBaseConfig(validateDocument);
    return {
      storage: config.storage,
      fileFilter: config.fileFilter,
      limits: {
        fileSize: maxSize, // 10 MB
      },
    };
  },
};
