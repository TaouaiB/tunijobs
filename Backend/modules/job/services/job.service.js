const pickFields = require('../../../core/utils/pickFields');
const Job = require('../models/jobModel');
const Company = require('../../company/models/companyModel');

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

  await job.save();

  return {
    job,
    message: `Job ${job.isActive ? 'activated' : 'deactivated'}`,
  };
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
