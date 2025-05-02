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
} = require('../services/applicationService');

const {
  submitApplicationValidator,
  updateApplicationValidator, // This is what we should use instead
  scheduleInterviewValidator,
  getApplicationValidator,
  getApplicationsByJobValidator,
  deleteApplicationValidator,
  searchApplicationsValidator,
} = require('../utils/validators/applicationValidator');

// =============================================
//               PUBLIC ROUTES
// =============================================

router.get('/:id', getApplicationValidator, getApplicationById);

// =============================================
//            CANDIDATE PROTECTED ROUTES
// =============================================

router.post(
  '/:jobId/apply',
  submitApplicationValidator,
  submitApplication
);

router.get(
  '/candidate/:candidateId',
  getApplicationsByCandidate
);

// Changed to use updateApplicationValidator instead
router.put('/:id/withdraw', updateApplicationValidator, withdrawApplication);

// =============================================
//            COMPANY PROTECTED ROUTES
// =============================================

router.get('/jobs/:jobId', getApplicationsByJobValidator, getApplicationsByJob);

// Changed to use updateApplicationValidator
router.put('/:id/status', updateApplicationValidator, updateApplicationStatus);

router.post('/:id/interviews', scheduleInterviewValidator, scheduleInterview);

// =============================================
//               ADMIN ROUTES
// =============================================

router.get('/', searchApplicationsValidator, getApplicationDashboard);

router.delete('/:id', deleteApplicationValidator, deleteApplication);

module.exports = router;
