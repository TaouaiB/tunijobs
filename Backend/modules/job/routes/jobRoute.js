const router = require('express').Router();

const authenticateJWT = require('../../../core/middlewares/authentication/authenticateJWT');
const abilityInjector = require('../../../core/middlewares/authorization/ability.injector');
const authorize = require('../../../core/middlewares/authorization/authorization.middleware');

const {
  createJob,
  getAllJobs,
  getFeaturedJobs,
  getJob,
  updateJob,
  setJobActiveStatus,
  deleteJob,
  getJobsByCompany,
  getJobResource,
} = require('../controllers/jobController');

const {
  createJobValidator,
  updateJobValidator,
  getJobValidator,
  deleteJobValidator,
} = require('../validators/jobValidator');

/*--------------------------------------------------
  Public Routes
---------------------------------------------------*/
// Guest and all authenticated users can read jobs
router.get('/', getAllJobs);
router.get('/featured', getFeaturedJobs);
router.get('/:id', getJobValidator, getJob);

/*--------------------------------------------------
  Protected Routes
---------------------------------------------------*/
// Company admin routes
router.post(
  '/:companyId/jobs',
  authenticateJWT,
  abilityInjector,
  authorize('create', 'Job'),
  createJobValidator,
  createJob
);

router.put(
  '/:id',
  authenticateJWT,
  abilityInjector,
  authorize('update', 'Job', getJobResource),
  updateJobValidator,
  updateJob
);

router.patch(
  '/:id/set-active',
  authenticateJWT,
  abilityInjector,
  authorize('update', 'Job', getJobResource),
  setJobActiveStatus
);

router.delete(
  '/:id',
  authenticateJWT,
  abilityInjector,
  authorize('delete', 'Job', getJobResource),
  deleteJobValidator,
  deleteJob
);

// Get jobs by specific company (public read access)
router.get('/:companyId/jobs', getJobsByCompany);

module.exports = router;
