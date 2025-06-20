const router = require('express').Router();

// Import CASL middlewares
const abilityInjector = require('../../../core/middlewares/authorization/ability.injector');
const authorize = require('../../../core/middlewares/authorization/authorization.middleware');

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
} = require('../controllers/jobController');

// Import validators
const {
  createJobValidator,
  updateJobValidator,
  getJobValidator,
  deleteJobValidator,
} = require('../validators/jobValidator');

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
router.post('/:companyId/jobs', createJobValidator, createJob);*

router.put(
  '/:id',
  updateJobValidator,
  abilityInjector,
  authorize('update', 'Job', getJobById),
  updateJob
);

router.patch('/:id/set-active', setJobActiveStatus);
router.delete('/:id', deleteJobValidator, deleteJob);

module.exports = router;
