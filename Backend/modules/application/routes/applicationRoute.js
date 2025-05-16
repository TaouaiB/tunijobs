const express = require('express');
const router = express.Router();

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
  uploadDocument,
  removeDocument,
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

router.post('/:jobId/apply', submitApplicationValidator, submitApplication);

router.get(
  '/candidate/:candidateId',
  getApplicationsByCandidateValidator,
  getApplicationsByCandidate
);

router.put('/:id/withdraw', updateApplicationValidator, withdrawApplication);

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
router.put('/:id/status', updateApplicationValidator, updateApplicationStatus);

router.patch('/:id/interviews', scheduleInterviewValidator, scheduleInterview);

// =============================================
//               ADMIN ROUTES
// =============================================

router.delete('/:id', deleteApplicationValidator, deleteApplication);

module.exports = router;
