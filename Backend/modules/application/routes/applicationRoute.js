const express = require('express');
const router = express.Router();

const authenticateJWT = require('../../../core/middlewares/authentication/authenticateJWT');
const abilityInjector = require('../../../core/middlewares/authorization/ability.injector');
const authorize = require('../../../core/middlewares/authorization/authorization.middleware');
const checkAdminRole = require('../../../core/middlewares/authorization/checkAdminRole');

const {
  submitApplication,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationById,
  getApplicationsByCandidate,
  getApplicationsByJob,
  getApplicationDashboard,
  deleteApplication,
  scheduleInterview,
  updateInterviewResult,
  uploadDocument,
  removeDocument,
  getApplicationsByCompany,
  getApplicationResource,
} = require('../controllers/applicationController');

const {
  submitApplicationValidator,
  updateApplicationValidator,
  scheduleInterviewValidator,
  getApplicationValidator,
  getApplicationsByJobValidator,
  getApplicationsByCandidateValidator,
  deleteApplicationValidator,
  searchApplicationsValidator,
  updateInterviewResultValidator,
  getApplicationsByCompanyValidator,
} = require('../validators/applicationValidator');
const normalizeUploadFields = require('../../../core/middlewares/multer/normalizeUploads');

// =============================================
//               PUBLIC ROUTES
// =============================================

// This route is for the admin dashboard to search applications
// and is not protected by authentication or authorization YET
router.get('/dashboard', searchApplicationsValidator, getApplicationDashboard);

router.get('/:id', getApplicationValidator, getApplicationById);

// =============================================
//            CANDIDATE PROTECTED ROUTES
// =============================================

router.post(
  '/:jobId/apply',
  authenticateJWT,
  abilityInjector,
  authorize('create', 'Application'),
  submitApplicationValidator,
  submitApplication
);

router.get(
  '/candidate/:candidateId',
  getApplicationsByCandidateValidator,
  getApplicationsByCandidate
);

// Get all applications for a specific company
router.get(
  '/company/:companyId',
  getApplicationsByCompanyValidator,
  getApplicationsByCompany
);

router.put(
  '/:id/withdraw',
  authenticateJWT,
  abilityInjector,
  authorize('withdraw', 'Application', getApplicationResource),
  updateApplicationValidator,
  withdrawApplication
);

router.post(
  '/:id/documents',
  updateApplicationValidator,
  normalizeUploadFields,
  uploadDocument
);

router.delete(
  '/:id/remove-document',
  updateApplicationValidator,
  removeDocument
);

// =============================================
//            COMPANY PROTECTED ROUTES
// =============================================

router.get('/jobs/:jobId', getApplicationsByJobValidator, getApplicationsByJob);

// Changed to use updateApplicationValidator
router.put(
  '/:id/status',
  authenticateJWT,
  abilityInjector,
  authorize('update', 'Application', getApplicationResource),
  updateApplicationValidator,
  updateApplicationStatus
);

router.patch('/:id/interviews', scheduleInterviewValidator, scheduleInterview);

router.patch(
  '/:id/interviews/:interviewId/result',
  updateApplicationValidator,
  updateInterviewResultValidator,
  updateInterviewResult
);

// =============================================
//               ADMIN ROUTES
// =============================================

router.delete('/:id', deleteApplicationValidator, deleteApplication);

module.exports = router;
