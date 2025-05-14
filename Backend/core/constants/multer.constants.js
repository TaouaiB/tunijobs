module.exports = {
    WEBP_CONFIG: {
      quality: 85,
      alphaQuality: 90,
      lossless: false,
      effort: 4,
    },
    MIME_TYPES: {
      images: ['image/jpeg', 'image/png', 'image/webp'],
      documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
    },
    DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };
  