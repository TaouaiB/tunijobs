const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const pickFields = require('../utils/pickFields');

const Job = require('../models/jobModel');
const Company = require('../models/companyModel');

/*--------------------------------------------------
  Job Management (Company-Based Operations)
---------------------------------------------------*/

// @desc    Create a new job
// @route   POST /api/v1/companies/:companyId/jobs
// @access  Private (Company Admin)
exports.createJob = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // 1) Verify company exists
  if (!(await Company.exists({ _id: companyId }))) {
    return next(new ApiError(`Company ${companyId} not found`, 404));
  }

  // 2) Create with filtered fields
  const job = await Job.create({
    ...pickFields(req.body, 'job', true), // Strict mode enabled
    companyId,
  }).then((doc) => doc.populate('company', 'companyName logo industry'));

  res.status(201).json({
    status: 'success',
    data: { job },
  });
});

// @desc    Get all jobs
// @route   GET /api/v1/jobs
// @access  Public
exports.getAllJobs = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({ isActive: true })
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

// @desc    Get featured jobs
// @route   GET /api/v1/jobs/featured
// @access  Public
exports.getFeaturedJobs = asyncHandler(async (req, res, next) => {
  const jobs = await Job.findActiveJobs()
    .where('isFeatured')
    .equals(true)
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs,
    },
  });
});

// @desc    Get job by ID
// @route   GET /api/v1/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id)
    .populate('company', 'companyName logo industry')
    .populate('applications');

  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }

  // Increment view count
  await job.incrementViews();

  res.status(200).json({
    status: 'success',
    data: {
      job,
    },
  });
});

// @desc    Update job
// @route   PUT /api/v1/jobs/:id
// @access  Private (Company Admin)
exports.updateJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    pickFields(req.body, 'job', true), // Strict mode
    {
      new: true,
      runValidators: true,
    }
  ).populate('company', 'companyName logo industry');

  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      job,
    },
  });
});

// @desc    Toggle job status (active/inactive)
// @route   PATCH /api/v1/jobs/:id/toggle-status
// @access  Private (Company Admin)
exports.toggleJobStatus = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }

  job.isActive = !job.isActive;
  if (!job.isActive) job.isFeatured = false; // Can't feature inactive jobs

  await job.save();

  res.status(200).json({
    status: 'success',
    data: {
      job,
    },
  });
});

// @desc    Delete job
// @route   DELETE /api/v1/jobs/:id
// @access  Private (Company Admin)
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findByIdAndDelete(req.params.id);

  if (!job) {
    return next(new ApiError(`No job found with id: ${req.params.id}`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Get jobs by company
// @route   GET /api/v1/companies/:companyId/jobs
// @access  Public
exports.getJobsByCompany = asyncHandler(async (req, res, next) => {
  const jobs = await Job.find({ companyId: req.params.companyId })
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: jobs.length,
    data: {
      jobs,
    },
  });
});
