const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const { documentUpload } = require('../../config/multer/documents.config');
const { storeDocument } = require('../../utils/processors/documents/storage');
const ApiError = require('../../utils/ApiError');

const upload = multer(documentUpload());

const uploadCandidateDocuments = upload.fields([
  { name: 'resumeFile', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

const resumeOutputDir = path.join(process.cwd(), 'uploads/candidates/resumes');
const documentsOutputDir = path.join(process.cwd(), 'uploads/documents');

const documentUploadHandler =
  (opts = {}) =>
  (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    console.log('📋 Content-Type:', contentType);
    console.log('📋 Request headers:', req.headers);

    // ✅ NEW: If not multipart/form-data, skip multer completely
    if (!contentType.startsWith('multipart/form-data')) {
      return next();
    }
    console.log('✅ Multipart request - processing with Multer');

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
        if (req.files?.resumeFile?.[0]) {
          const file = req.files.resumeFile[0];
          const saved = await storeDocument(
            file.buffer,
            file.originalname, // Original filename from Multer
            resumeOutputDir
          );

          uploadedFiles.resume = {
            originalName: saved.originalName, // ✅ Preserved exactly as you want
            mimetype: file.mimetype, // From Multer file object
            size: file.size, // From Multer file object
            url: `/uploads/candidates/resume/${path.basename(saved.path)}`,
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

        // Additional Documents
        if (req.files?.documents) {
          uploadedFiles.documents = [];
          for (const file of req.files.documents) {
            const saved = await storeDocument(
              file.buffer,
              file.originalname,
              documentsOutputDir
            );
            uploadedFiles.documents.push({
              name: saved.originalName,
              url: saved.url,
              type: file.mimetype,
              size: file.size,
            });
          }
        }

        //Only throw error if no files AND allowNoFiles flag is false or not set
        if (
          !opts.allowNoFiles &&
          !uploadedFiles.resume &&
          !uploadedFiles.coverLetter &&
          (!uploadedFiles.documents || uploadedFiles.documents.length === 0)
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
