const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const { documentUpload } = require('../../config/multer/documents.config');
const { storeDocument } = require('../../utils/processors/documents/storage');
const ApiError = require('../../utils/ApiError');

const upload = multer(documentUpload());

const uploadCandidateDocuments = upload.fields([
  { name: 'resumeUrl', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

const outputDir = path.join(process.cwd(), 'uploads/documents');

const documentUploadHandler = (req, res, next) => {
  uploadCandidateDocuments(req, res, async (err) => {
    if (err) {
      let statusCode = 400;
      let message = err.message;

      if (typeof err.code === 'string') {
        switch (err.code) {
          case 'LIMIT_UNEXPECTED_FILE':
            if (err.field === 'coverLetter') {
              message = 'Only 1 cover letter allowed.';
            } else if (err.field === 'resumeUrl') {
              message = 'Only 1 resume file allowed.';
            } else if (err.field === 'documents') {
              message = 'Too many files uploaded. Max 5 documents allowed.';
            } else {
              message = `Unexpected field: ${err.field}`;
            }
            break;
          default:
            statusCode = 500;
            message = 'Upload failed due to a server error.';
        }
      }

      return next(new ApiError(message, statusCode));
    }

    try {
      const uploadedFiles = {};

      // Resume
      if (req.files?.resumeUrl?.[0]) {
        const file = req.files.resumeUrl[0];
        const saved = await storeDocument(
          file.buffer,
          file.originalname,
          outputDir
        );

        uploadedFiles.resume = {
          originalName: saved.originalName, // ✅ Use what's returned from storeDocument
          url: saved.url,
          mimetype: file.mimetype,
          size: file.size,
        };

        req.documentInfo = uploadedFiles.resume; // ✅ Required for storeResume
      }

      // Cover Letter
      if (req.files?.coverLetter?.[0]) {
        const file = req.files.coverLetter[0];
        const saved = await storeDocument(
          file.buffer,
          file.originalname,
          outputDir
        );
        uploadedFiles.coverLetter = {
          name: saved.originalName,
          url: saved.url,
          type: file.mimetype,
          size: file.size,
        };
      }

      // Documents
      if (req.files?.documents) {
        uploadedFiles.documents = [];
        for (const file of req.files.documents) {
          const saved = await storeDocument(
            file.buffer,
            file.originalname,
            outputDir
          );
          uploadedFiles.documents.push({
            name: saved.originalName,
            url: saved.url,
            type: file.mimetype,
            size: file.size,
          });
        }
      }

      // Verify we have at least one file
      if (
        !uploadedFiles.resume &&
        !uploadedFiles.coverLetter &&
        !uploadedFiles.documents?.length
      ) {
        return next(new ApiError('No valid files were uploaded', 400));
      }

      req.uploadedFiles = uploadedFiles;
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = documentUploadHandler;
