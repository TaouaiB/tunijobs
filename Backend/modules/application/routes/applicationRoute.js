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
  getMyApplication,
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
const documentUploadHandler = require('../../../core/middlewares/multer/documentUploadHandler');

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
  '/candidate/me',
  authenticateJWT,
  getApplicationsByCandidateValidator,
  getMyApplication
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
  (req, res, next) => {
    console.log('✅ Reached POST /documents route');
    next();
  },
  documentUploadHandler(), // builds req.uploadedFiles from buffers
  authenticateJWT,
  abilityInjector,
  authorize('add-document', 'Application'),
  (req, res, next) => {
    console.dir(req.files, { depth: 4 });
    next();
  },
  uploadDocument // uses req.uploadedFiles
);

router.delete(
  '/:id/remove-document',
  updateApplicationValidator,
  removeDocument
);

// =============================================
//            COMPANY PROTECTED ROUTES
// =============================================

// To be checked probably to be removed
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

router.patch(
  '/:id/interviews',
  authenticateJWT,
  abilityInjector,
  authorize('update', 'Application', getApplicationResource),
  scheduleInterviewValidator,
  scheduleInterview
);

// next to work on
router.patch(
  '/:id/interviews/:interviewId/result',
  authenticateJWT,
  abilityInjector,
  authorize('update', 'Application', getApplicationResource),
  updateApplicationValidator,
  updateInterviewResultValidator,
  updateInterviewResult
);

// =============================================
//               ADMIN ROUTES
// =============================================

router.delete('/:id', deleteApplicationValidator, deleteApplication);

module.exports = router;
