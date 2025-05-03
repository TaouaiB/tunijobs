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
  updateApplicationValidator,
  scheduleInterviewValidator,
  getApplicationValidator,
  getApplicationsByJobValidator,
  getApplicationsByCandidateValidator,
  deleteApplicationValidator,
  searchApplicationsValidator,
} = require('../utils/validators/applicationValidator');

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
