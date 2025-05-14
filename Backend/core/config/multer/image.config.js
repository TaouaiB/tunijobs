const { createBaseConfig } = require('./base.config');
const { validateImage } = require('../../utils/processors/image/validator');

module.exports = {
  imageUpload: (maxSize = 5 * 1024 * 1024) => {
    const config = createBaseConfig(validateImage);
    return {
      ...config,
      limits: { fileSize: maxSize }
    };
  }
};
