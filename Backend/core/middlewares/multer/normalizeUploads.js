function normalizeUploadFields(req, res, next) {
    const files = req.files || {};
  
    req.uploads = {
      resume: files.resumeUrl?.[0] && formatFile(files.resumeUrl[0]),
      coverLetter: files.coverLetter?.[0] && formatFile(files.coverLetter[0]),
      documents: (files.documents || []).map(formatFile),
    };
  
    next();
  }
  
  function formatFile(file) {
    return {
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: file.path.replace(/\\/g, '/'),
    };
  }
  
  module.exports = normalizeUploadFields;
  