const WEBP_CONFIG = {
  quality: 85,
  alphaQuality: 90,
  lossless: false,
  effort: 4,
};

const MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
};

module.exports = {
  WEBP_CONFIG,
  MIME_TYPES,
  get DOCUMENT_TYPES() {
    // Exclude plain text from accepted document types
    return MIME_TYPES.documents.filter((type) => type !== 'text/plain');
  },
};
