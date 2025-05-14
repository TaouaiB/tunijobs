const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../../../utils/ApiError');

exports.storeDocument = async (buffer, originalName, outputDir) => {
  await fs.ensureDir(outputDir);
  
  const ext = path.extname(originalName);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9-_.]/g, '_');
  const uniqueName = `${uuidv4()}${ext}`;
  const outputPath = path.join(outputDir, uniqueName);

  await fs.writeFile(outputPath, buffer);

  return {
    path: outputPath,
    url: `/uploads/documents/${uniqueName}`,
    originalName: sanitizedName
  };
};