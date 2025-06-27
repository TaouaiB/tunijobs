const pickFields = require('../../../core/utils/pickFields');
const Job = require('../models/jobModel');
const Company = require('../../company/models/companyModel');
const ApiError = require('../../../core/utils/ApiError');

/**
 * @namespace JobService
 * @description Contains business logic for job operations
 */

/**
 * @desc    Create a new job
 * @param   {string} companyId - The ID of the company
 * @param   {Object} jobData - Job data
 * @return  {Promise<Object>} The created job
 * @memberof JobService
 */
exports.createJob = async (companyId, jobData) => {
  if (!(await Company.exists({ _id: companyId }))) {
    throw new Error(`Company ${companyId} not found`);
  }

  return Job.create({
    ...pickFields(jobData, 'job', true),
    companyId,
  }).then((doc) => doc.populate('company', 'companyName logo industry'));
};

/**
 * @desc    Get all active jobs
 * @return  {Promise<Array>} Array of active jobs
 * @memberof JobService
 */
exports.getAllActiveJobs = async () => {
  return Job.find({ isActive: true })
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');
};

/**
 * @desc    Get featured jobs
 * @return  {Promise<Array>} Array of featured jobs
 * @memberof JobService
 */
exports.getFeaturedJobs = async () => {
  return Job.findActiveJobs()
    .where('isFeatured')
    .equals(true)
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');
};

/**
 * @desc    Get job by ID
 * @param   {string} id - Job ID
 * @return  {Promise<Object|null>} The found job or null
 * @memberof JobService
 */
exports.getJobById = async (id) => {
  const job = await Job.findById(id).populate(
    'company',
    'companyName logo industry'
  );
  if (job) {
    await job.incrementViews();
  }
  return job;
};

/**
 * @desc    Update job
 * @param   {string} id - Job ID
 * @param   {Object} updateData - Data to update
 * @return  {Promise<Object|null>} The updated job or null
 * @memberof JobService
 */
exports.updateJob = async (id, updateData) => {
  // Make sure isFeatured is not updated via general update
  if ('isFeatured' in updateData) {
    delete updateData.isFeatured;
  }
  return Job.findByIdAndUpdate(id, pickFields(updateData, 'job', true), {
    new: true,
    runValidators: true,
  }).populate('company', 'companyName logo industry');
};

/**
 * @desc    Toggle job active status
 * @param   {string} id - Job ID
 * @return  {Promise<Object>} Object containing job and message
 * @memberof JobService
 */
exports.toggleJobActiveStatus = async (id) => {
  const job = await Job.findById(id);
  if (!job) return { job: null, message: 'Job not found' };

  // Toggle the isActive status
  job.isActive = !job.isActive;

  // If deactivating, also unfeature the job
  if (!job.isActive && job.isFeatured) {
    job.isFeatured = false;
  }
  if (!job.isActive && job.requestedToBeFeatured) {
    job.requestedToBeFeatured = false;
  }

  await job.save();

  return {
    job,
    message: `Job ${job.isActive ? 'activated' : 'deactivated'}`,
  };
};

/**
 * @desc    Toggle job isFeatured status
 * @param   {string} id - Job ID
 * @return  {Promise<Object>} Object containing job and message
 * @memberof JobService
 */
exports.toggleJobFeaturedStatus = async (id) => {
  const job = await Job.findById(id);
  if (!job) return { job: null, message: 'Job not found' };

  if (!job.requestedToBeFeatured && !job.isFeatured) {
    throw new ApiError('Feature request not submitted for this job', 400);
  }

  job.isFeatured = !job.isFeatured;

  if (job.isFeatured) {
    job.requestedToBeFeatured = false;
    job.featuredAt = new Date(); // set current time when featured
  } else {
    job.featuredAt = null; // reset timestamp when unfeatured
  }

  await job.save();

  return {
    job,
    message: `Job ${job.isFeatured ? 'marked as featured' : 'unfeatured'}`,
  };
};

/**
 * @desc    Request a job to be featured (company initiates)
 * @param   {string} jobId - Job ID
 * @param   {Object} user - Authenticated user object
 * @return  {Promise<Object>} Job document with updated request flag
 * @memberof JobService
 */
exports.requestJobToBeFeatured = async (jobId, user) => {
  const job = await Job.findById(jobId).populate('companyId');

  if (!job) throw new ApiError('Job not found', 404);
  if (!job.isActive)
    throw new ApiError('Cannot request feature on inactive job', 400);
  if (job.isFeatured) throw new ApiError('Job is already featured', 400);
  if (job.requestedToBeFeatured) {
    throw new ApiError('Feature request already submitted', 400);
  }

  job.requestedToBeFeatured = true;
  await job.save();

  return job;
};

/**
 * Find all featured jobs with featuredAt date older than given date
 * @param {Date} date
 * @returns {Promise<Array>}
 */
exports.findFeaturedJobsOlderThan = async (date) => {
  return Job.find({
    isFeatured: true,
    featuredAt: { $lt: date },
  });
};

/**
 * Unfeature job by ID (update isFeatured=false and reset requestedToBeFeatured)
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
exports.unfeatureJobById = async (id) => {
  const job = await Job.findById(id);
  if (!job) throw new ApiError('Job not found', 404);

  job.isFeatured = false;
  job.requestedToBeFeatured = false;
  await job.save();
  console.log(`Unfeatured job ${id}`); // Log for debugging

  return job;
};

/**
 * @desc    Delete job
 * @param   {string} id - Job ID
 * @return  {Promise<Object|null>} The deleted job or null
 * @memberof JobService
 */
exports.deleteJob = async (id) => {
  return Job.findByIdAndDelete(id);
};

/**
 * @desc    Get jobs by company
 * @param   {string} companyId - Company ID
 * @return  {Promise<Array>} Array of jobs
 * @memberof JobService
 */
exports.getJobsByCompany = async (companyId) => {
  return Job.find({ companyId })
    .populate('company', 'companyName logo industry')
    .sort('-createdAt');
};
