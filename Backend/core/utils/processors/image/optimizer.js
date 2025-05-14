const sharp = require('sharp');
const { WEBP_CONFIG } = require('../../../constants/multer.constants');

exports.processImage = async (buffer, operations) => {
  let processor = sharp(buffer);

  if (operations.resize) {
    processor = processor.resize(operations.resize);
  }

  if (operations.quality) {
    processor = processor.webp({ ...WEBP_CONFIG, quality: operations.quality });
  }

  return processor.toBuffer();
};
