const Application = require('../models/applicationModel');
const {
  extractText,
  cleanText,
} = require('../../../core/utils/parsers/pdfTextParser');
const ApiError = require('../../../core/utils/ApiError');

const path = require('path');

// Robust import: always expose a callable parseResume
let resumeParser;
try {
  resumeParser = require('resume-parser');
  if (!resumeParser?.parseResume) {
    resumeParser = { parseResume: async () => ({}) };
  }
} catch {
  resumeParser = { parseResume: async () => ({}) };
}

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
  } else if (application.documents?.length) {
    doc = application.documents[application.documents.length - 1];
  } else if (application.resumeUrl) {
    doc = { name: 'resume', url: application.resumeUrl };
  }
  if (!doc || !doc.url)
    throw new ApiError('No documents available in application', 400);
  const filePath = path.join(process.cwd(), doc.url);

  // 3️⃣ Try specialized resume-parser first
  try {
    return {
      //application.service writes with strict:false
      documentName: doc.name || doc.originalName || 'resume',
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
      const rawText = await extractText(filePath);
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
