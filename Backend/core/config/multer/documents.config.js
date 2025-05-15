const { createBaseConfig } = require('./base.config');
const {
  validateDocument,
} = require('../../utils/processors/documents/validator');

module.exports = {
  documentUpload: (maxSize = 10 * 1024 * 1024) => {
    const config = createBaseConfig(validateDocument);
    return { ...config, limits: { fileSize: maxSize } };
  },
};
