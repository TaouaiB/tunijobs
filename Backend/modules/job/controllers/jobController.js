const asyncHandler = require('express-async-handler');

const ApiError = require('../../../core/utils/ApiError');
const pickFields = require('../../../core/utils/pickFields');

const Job = require('../models/jobModel');
const Company = require('../../company/models/companyModel');

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
  const job = await Job.findById(req.params.id).populate(
    'company',
    'companyName logo industry'
  );

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

// @desc    Activate/Deactivate a job (with auto-unfeature)
// @route   PATCH /api/v1/jobs/:id/set-active
// @access  Private (Company Admin)
exports.setJobActiveStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body; // Expects { isActive: true/false }

  // 1) Find job
  const job = await Job.findById(id);
  if (!job) {
    return next(new ApiError(`No job found with id: ${id}`, 404));
  }

  // 2) Update status (skip if already in desired state)
  if (job.isActive === isActive) {
    return res.status(200).json({
      status: 'success',
      message: `Job is already ${isActive ? 'active' : 'inactive'}`,
      data: { job },
    });
  }

  // 3) Apply changes
  job.isActive = isActive;

  // 4) Business Rule: Deactivated jobs can't be featured
  if (!isActive && job.isFeatured) {
    job.isFeatured = false;
  }

  // 5) Save and return
  await job.save();

  res.status(200).json({
    status: 'success',
    message: `Job ${isActive ? 'activated' : 'deactivated'}`,
    data: { job },
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

  res.status(200).json({
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
