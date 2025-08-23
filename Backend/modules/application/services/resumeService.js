const path = require('path');
const Application = require('../models/applicationModel');
let Job; try { Job = require('../../job/models/jobModel'); } catch { Job = null; }

const ApiError = require('../../../core/utils/ApiError');
const { extractText, cleanText } = require('../../../core/utils/parsers/pdfTextParser');
const { analyzeByText, mapN8nToParsedResume } = require('../../analysis/services/n8nClient');

async function parseApplicationDocument(applicationId, documentId = null) {
  // 1) Load application
  const application = await Application.findById(applicationId)
    .select('jobId candidateId documents resumeUrl')
    .lean();
  if (!application) throw new ApiError('Application not found', 404);

  // 2) Pick document
  let doc = null;
  if (documentId) {
    doc = application.documents?.find(d => d._id?.toString() === String(documentId));
    if (!doc) throw new ApiError('Document not found in application', 404);
  } else if (application.documents?.length) {
    doc = application.documents[application.documents.length - 1];
  } else if (application.resumeUrl) {
    doc = { url: application.resumeUrl, name: 'resume' };
  }
  if (!doc?.url) throw new ApiError('No documents available in application', 400);

  // 3) Extract resume text (never throws now)
  const filePath = path.isAbsolute(doc.url) ? doc.url : path.join(process.cwd(), doc.url);
  const resumeText = cleanText(await extractText(filePath)); // may be ''

  // 4) Build JD (best effort)
  let jobDescription = '';
  if (application.jobId && Job) {
    const job = await Job.findById(application.jobId)
      .select('summary description requirements responsibilities')
      .lean();
    jobDescription = [job?.summary, job?.description, job?.requirements, job?.responsibilities]
      .filter(Boolean).join('\n\n');
  }

  // 5) ALWAYS call n8n (even if resumeText === '')
  const n8nJson = await analyzeByText(resumeText, jobDescription);

  // 6) Map → metadata.parsedResume
  return mapN8nToParsedResume(n8nJson);
}

module.exports = { parseApplicationDocument };
