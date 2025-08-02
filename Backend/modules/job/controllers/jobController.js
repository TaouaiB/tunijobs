const asyncHandler = require('express-async-handler');
const jobService = require('../services/job.service');
const ApiError = require('../../../core/utils/ApiError');

/**
 * @namespace JobController
 * @description Handles HTTP requests related to jobs
 */

/**
 * @desc    Create a new job
 * @route   POST /api/v1/companies/:companyId/jobs
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.createJob = asyncHandler(async (req, res, next) => {
  const companyId = req.user.companyId;
  const job = await jobService.createJob(companyId, req.body);
  res.status(201).json({
    status: 'success',
    data: { job },
  });
});

/**
 * @desc    Get jobs of the authenticated user's company
 * @route   GET /api/v1/jobs/me/jobs
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.getJobsByCompanyForMe = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) {
    return res.status(400).json({ message: 'User has no associated company' });
  }
  const jobs = await jobService.getJobsByCompany(companyId);
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: { jobs },
  });
});

/**
 * @desc    Get all jobs
 * @route   GET /api/v1/jobs
 * @access  Public
 * @memberof JobController
 */
exports.getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.getAllActiveJobs();
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: { jobs },
  });
});

/**
 * @desc    Get featured jobs
 * @route   GET /api/v1/jobs/featured
 * @access  Public
 * @memberof JobController
 */
exports.getFeaturedJobs = asyncHandler(async (req, res) => {
  const jobs = await jobService.getFeaturedJobs();
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: { jobs },
  });
});

/**
 * @desc    Get job by ID
 * @route   GET /api/v1/jobs/:id
 * @access  Public
 * @memberof JobController
 */
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await jobService.getJobById(req.params.id);
  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

/**
 * Dynamic resource resolver for CASL authorization
 * Handles both company job listing (by companyId) and specific job fetch (by jobId param)
 */
exports.getJobResource = async (req) => {
  // For create or company-wide GET: use user’s companyId
  const isCreateOrListForCompany =
    req.method === 'POST' ||
    (req.method === 'GET' && req.originalUrl.includes('/companies/me/jobs'));

  if (isCreateOrListForCompany) {
    return {
      companyId: req.user.companyId,
      __type: 'Job',
    };
  }

  // For individual job routes (e.g., /jobs/:id)
  const job = await jobService.getJobById(req.params.id);
  if (!job) return null;

  return job;
};

/**
 * @desc    Update job
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.updateJob = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next(new ApiError('Admins cannot update jobs.', 403));
  }
  const job = await jobService.updateJob(req.params.id, req.body);
  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: { job },
  });
});

/**
 * @desc    Activate/Deactivate a job (with auto-unfeature)
 * @route   PATCH /api/v1/jobs/:id/set-active
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.setJobActiveStatus = asyncHandler(async (req, res, next) => {
  const result = await jobService.toggleJobActiveStatus(
    req.params.id,
    req.body.isActive
  );
  if (!result.job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: { job: result.job },
  });
});

/**
 * @desc    Company requests to feature a job (admin reviews later)
 * @route   PATCH /api/v1/jobs/:id/request-feature
 * @access  Private (Company only)
 * @memberof JobController
 */
exports.requestFeature = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'admin') {
    return next(new ApiError('Admins cannot requestFeature', 403));
  }
  const job = await jobService.requestJobToBeFeatured(req.params.id, req.user);

  res.status(200).json({
    status: 'success',
    message: 'Feature request submitted for admin review',
    data: { job },
  });
});

/**
 * @desc    Toggle job isFeatured status
 * @route   PATCH /api/v1/jobs/:id/toggle-featured
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.toggleFeaturedStatus = asyncHandler(async (req, res, next) => {
  const result = await jobService.toggleJobFeaturedStatus(req.params.id);
  if (!result.job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    message: result.message,
    data: { job: result.job },
  });
});

/**
 * @desc    Delete job
 * @route   DELETE /api/v1/jobs/:id
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await jobService.deleteJob(req.params.id);
  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

/**
 * @desc    Get jobs by company
 * @route   GET /api/v1/companies/:companyId/jobs
 * @access  Public
 * @memberof JobController
 */
exports.getJobsByCompany = asyncHandler(async (req, res) => {
  const jobs = await jobService.getJobsByCompany(req.params.companyId);
  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: { jobs },
  });
});
