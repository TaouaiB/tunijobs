const asyncHandler = require('express-async-handler');
const ApplicationService = require('../services/application.service');
const documentUploadHandler = require('../../../core/middlewares/multer/documentUploadHandler');
const ApiError = require('../../../core/utils/ApiError');
const Application = require('../models/applicationModel');

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
exports.submitApplication = [
  documentUploadHandler({ allowNoFiles: true }), // Allow no files to be uploaded
  asyncHandler(async (req, res) => {
    const result = await ApplicationService.submitApplication(
      req.params.jobId,
      {
        ...req.body,
        candidateId: req.user.candidateId,
      },
      req.ip,
      req.get('User-Agent'),
      req.uploadedFiles
    );

    res.status(201).json(result);
  }),
];

/**
 * @desc    Update application status
 * @route   PUT /api/v1/applications/:id/status
 * @access  Employer/Admin
 */
exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const result = await ApplicationService.updateApplicationStatus(
    req.params.id,
    req.body
  );

  res.json(result);
});

/**
 * @desc    Withdraw an application
 * @route   PUT /api/v1/applications/:id/withdraw
 * @access  Candidate
 */
exports.withdrawApplication = asyncHandler(async (req, res) => {
  const candidateId = req.user.candidateId;
  const result = await ApplicationService.withdrawApplication(
    req.params.id,
    candidateId,
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
 * @desc    Get My Application
 * @route   GET /api/v1/applications/candidate/me
 * @access  Candidate
 */
exports.getMyApplication = asyncHandler(async (req, res) => {
  const candidateId = req.user.candidateId;

  const result =
    await ApplicationService.getApplicationsByCandidate(candidateId);

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
 * @desc    Controller to get all applications for a company
 * @route   GET /api/v1/applications/company/:companyId
 * @access  Company (Protected)
 */
exports.getApplicationsByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const filters = {
      status: req.query.status,
      jobId: req.query.jobId,
      search: req.query.search,
    };

    const result = await ApplicationService.getApplicationsByCompany(
      companyId,
      filters
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

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
 * @desc    Update the result of a specific interview in an application
 * @route   PATCH /api/v1/applications/:id/interviews/:interviewId/result
 * @access  Employer
 */
exports.updateInterviewResult = asyncHandler(async (req, res) => {
  const { id, interviewId } = req.params;
  const { result } = req.body;

  const response = await ApplicationService.updateInterviewResult(
    id,
    interviewId,
    result
  );

  res.status(200).json(response);
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

/**
 * @desc Application Resource Getter
 * Now properly handles both resource fetching and authorization context
 */
exports.getApplicationResource = async (req) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId', 'companyId') // Populate job's companyId
      .lean();

    if (!application) {
      return {
        id: req.params.id,
        job: { companyId: null },
        candidateId: null,
      };
    }

    console.log('DEBUG - Application:', {
      id: application._id,
      jobCompanyId: application.jobId?.companyId?.toString(),
      userCompanyId: req.user.companyId,
    });

    return {
      id: application._id,
      job: {
        companyId: application.jobId?.companyId?.toString(),
      },
      candidateId: application.candidateId?.toString(),
      status: application.status,
    };
  } catch (error) {
    console.error('Error in getApplicationResource:', error);
    return {
      id: req.params.id,
      job: { companyId: null },
      candidateId: null,
    };
  }
};
