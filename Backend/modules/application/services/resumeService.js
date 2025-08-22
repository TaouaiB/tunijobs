const { ResumeParser } = require('resume-parser');
const Application = require('../models/applicationModel');
const {
  extractText,
  cleanText,
} = require('../../../core/utils/parsers/pdfTextParser');
const ApiError = require('../../../core/utils/ApiError');

/**
 * Parse a document from an Application
 * @param {string} applicationId - ID of the application
 * @param {string|null} documentId - optional, specific document to parse
 * @returns {Promise<Object>} structured JSON of parsed resume
 */
const parseApplicationDocument = async (applicationId, documentId = null) => {
  // 1️⃣ Fetch the Application
  const application = await Application.findById(applicationId)
    .populate('candidateId') // optional if you need candidate info
    .lean();

  if (!application) throw new ApiError('Application not found', 404);

  // 2️⃣ Select the document
  let doc;
  if (documentId) {
    doc = application.documents.find((d) => d._id.toString() === documentId);
    if (!doc) throw new ApiError('Document not found in application', 404);
  } else {
    // default to first document if exists
    doc = application.documents[0];
    if (!doc) throw new ApiError('No documents available in application', 400);
  }

  if (!doc.url) throw new ApiError('Document URL missing', 400);

  // 3️⃣ Try specialized resume-parser first
  try {
    const parsed = await ResumeParser.parseResume(doc.url);

    return {
      applicationId,
      candidateId: application.candidateId._id,
      documentName: doc.name,
      personal_info: {
        name: parsed.name || application.candidateId?.name || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        location: parsed.location || '',
      },
      experience: parsed.experience || [],
      education: parsed.education || [],
      skills: parsed.skills || [],
      summary: parsed.summary || '',
      parserUsed: 'resume-parser', 
      parserVersion: '1.0.0',
    };
  } catch (err) {
    console.warn('Resume parser failed, falling back to raw PDF text:', err);

    // 4️⃣ Fallback to pdfTextParser
    try {
      const rawText = await extractText(doc.url);
      return {
        applicationId,
        candidateId: application.candidateId._id,
        documentName: doc.name,
        rawText: cleanText(rawText),
      };
    } catch (fallbackErr) {
      throw new ApiError('Failed to parse document', 500);
    }
  }
};

module.exports = { parseApplicationDocument };
