const router = require('express').Router();

const {
  createCandidateValidator,
  updateCandidateValidator,
  getCandidateByUserIdValidator,
  deleteCandidateValidator,
} = require('../validators/candidateValidator');

const {
  createCandidate,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  getCandidateByUserId,
  deleteCandidateByUserId,
  updateResume,
  removeResume,
} = require('../controllers/CandidateController');
const authenticateJWT = require('../../../core/middlewares/authentication/authenticateJWT');

// ======== NEW /me routes ========
router.post(
  '/me/candidate',
  authenticateJWT,
  createCandidateValidator,
  createCandidate
);
router.get('/me/candidate', authenticateJWT, getCandidateByUserId);
router.put(
  '/me/candidate',
  authenticateJWT,
  updateCandidateValidator,
  updateCandidate
);
router.delete('/me/candidate', authenticateJWT, deleteCandidate);

router.patch('/me/candidate/resume', authenticateJWT, updateResume);
router.patch('/me/candidate/remove-resume', authenticateJWT, removeResume);

// ======== ADMIN ROUTES ========
router.get('/candidates', getAllCandidates);

// ======== OLD /:userId routes (to be protected later with CASL) ========
router.post('/:userId/candidate', createCandidateValidator, createCandidate);
router.get('/:userId/candidate', getCandidateByUserId);
router.put('/:userId/candidate', updateCandidateValidator, updateCandidate);
router.delete('/:userId/candidate', deleteCandidate);

router.patch('/:userId/candidate/resume', updateResume);
router.patch('/:userId/candidate/remove-resume', removeResume);

module.exports = router;
