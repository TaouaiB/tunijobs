const router = require('express').Router();

// Import controller methods using destructuring
const {
  createJob,
  getAllJobs,
  getFeaturedJobs,
  getJob,
  updateJob,
  setJobActiveStatus,
  deleteJob,
  getJobsByCompany,
} = require('../services/jobService');

// Import validators
const {
  createJobValidator,
  updateJobValidator,
  getJobValidator,
  deleteJobValidator,
} = require('../utils/validators/jobValidator');

/*--------------------------------------------------
  Public Routes
---------------------------------------------------*/
router.get('/', getAllJobs);
router.get('/featured', getFeaturedJobs);
router.get('/:id', getJobValidator, getJob);
router.get('/:companyId/jobs', getJobsByCompany);

/*--------------------------------------------------
  Protected Routes (Company Admin Only)
---------------------------------------------------*/
router.post('/:companyId/jobs', createJobValidator, createJob);
router.put('/:id', updateJobValidator, updateJob);
router.patch('/:id/set-active', setJobActiveStatus);
router.delete('/:id', deleteJobValidator, deleteJob);

module.exports = router;
