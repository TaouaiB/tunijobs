const asyncHandler = require('express-async-handler');
const ApplicationService = require('../services/application.service');
const documentUploadHandler = require('../../../core/middlewares/multer/documentUploadHandler');
const ApiError = require('../../../core/utils/ApiError');

/**
 * @desc    Upload a document to an application
 * @route   POST /api/v1/applications/:id/documents
 * @access  Private
 */
exports.uploadDocument = [
  documentUploadHandler,
  asyncHandler(async (req, res) => {
    if (!req.uploadedFiles) {
      throw new ApiError('No files were processed', 400);
    }

    const application = await ApplicationService.storeDocument(
      req.params.id,
      req.uploadedFiles
    );

    res.status(200).json({
      status: 'success',
      data: application,
    });
  }),
];

/**
 * @desc    Remove all documents from an application
 * @route   PATCH /api/v1/applications/:id/remove-document
 * @access  Private
 */
exports.removeDocument = asyncHandler(async (req, res) => {
  const updatedApplication = await ApplicationService.removeAllDocuments(
    req.params.id
  );

  res.json({
    status: 'success',
    message: 'Documents removed successfully',
    data: { application: updatedApplication },
  });
});

/**
 * @desc    Submit a new application for a job
 * @route   POST /api/v1/jobs/:jobId/apply
 * @access  Candidate
 */
exports.submitApplication = asyncHandler(async (req, res) => {
  const result = await ApplicationService.submitApplication(
    req.params.jobId,
    req.body,
    req.ip,
    req.get('User-Agent')
  );

  res.status(201).json(result);
});

/**
 * @desc    Update application status
 * @route   PUT /api/v1/applications/:id/status
 * @access  Employer/Admin
 */
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = await ApplicationService.updateApplicationStatus(req.params.id, req.body);

  res.json(result);
});

/**
 * @desc    Withdraw an application
 * @route   PUT /api/v1/applications/:id/withdraw
 * @access  Candidate
 */
exports.withdrawApplication = asyncHandler(async (req, res) => {
  const result = await ApplicationService.withdrawApplication(
    req.params.id,
    req.body
  );

  res.status(200).json(result);
});

/**
 * @desc    Get application by ID
 * @route   GET /api/v1/applications/:id
 * @access  Authenticated
 */
exports.getApplicationById = asyncHandler(async (req, res) => {
  const result = await ApplicationService.getApplicationById(req.params.id);

  res.json(result);
});

/**
 * @desc    Get applications by candidate
 * @route   GET /api/v1/applications/candidate/:candidateId
 * @access  Candidate
 */
exports.getApplicationsByCandidate = asyncHandler(async (req, res) => {
  const result = await ApplicationService.getApplicationsByCandidate(
    req.params.candidateId
  );

  res.json(result);
});

/**
 * @desc    Get applications by job
 * @route   GET /api/v1/applications/job/:jobId
 * @access  Employer/Admin
 */
exports.getApplicationsByJob = asyncHandler(async (req, res) => {
  const result = await ApplicationService.getApplicationsByJob(
    req.params.jobId
  );

  res.json(result);
});

/**
 * @desc    Get application dashboard
 * @route   GET /api/v1/applications/dashboard
 * @access  Employer/Admin
 */
exports.getApplicationDashboard = asyncHandler(async (req, res) => {
  const result = await ApplicationService.getApplicationDashboard(req.query);

  res.json(result);
});

/**
 * @desc    Delete application
 * @route   DELETE /api/v1/applications/:id
 * @access  Admin
 */
exports.deleteApplication = asyncHandler(async (req, res) => {
  await ApplicationService.deleteApplication(req.params.id);

  res.json({ status: 'success', message: 'Application deleted' });
});

/**
 * @desc    Schedule interview for an application
 * @route   PATCH /api/v1/applications/:id/schedule
 * @access  Employer
 */
exports.scheduleInterview = asyncHandler(async (req, res) => {
  const result = await ApplicationService.scheduleInterview(
    req.params.id,
    req.body
  );

  res.json(result);
});

/**
 * @desc    Recalculate application score
 * @route   PUT /api/v1/applications/:id/score
 * @access  Admin
 */
exports.recalculateScore = asyncHandler(async (req, res) => {
  const result = await ApplicationService.recalculateScore(req.params.id);

  res.json(result);
});
