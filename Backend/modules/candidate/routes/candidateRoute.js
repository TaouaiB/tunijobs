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
} = require('../controllers/candidateController');

router.get('/candidates', getAllCandidates);
router.post('/:userId/candidate', createCandidateValidator, createCandidate);
router.put('/:userId/candidate', updateCandidateValidator, updateCandidate);
router.patch('/:userId/candidate/resume', updateResume);
router.get(
  '/:userId/candidate',
  getCandidateByUserIdValidator,
  getCandidateByUserId
);
router.delete(
  '/candidate/:candidateId',
  deleteCandidateValidator,
  deleteCandidate
);

router.delete(
  '/:userId/candidate',
  getCandidateByUserIdValidator,
  deleteCandidateByUserId
);

module.exports = router;
