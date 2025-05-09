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
  const job = await jobService.createJob(req.params.companyId, req.body);
  res.status(201).json({
    status: 'success',
    data: { job },
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
 * @desc    Update job
 * @route   PUT /api/v1/jobs/:id
 * @access  Private (Company Admin)
 * @memberof JobController
 */
exports.updateJob = asyncHandler(async (req, res, next) => {
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
