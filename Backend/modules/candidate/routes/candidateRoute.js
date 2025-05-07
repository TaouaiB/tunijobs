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
} = require('../controllers/CandidateController');

router.get('/candidates', getAllCandidates);
router.post('/:userId/candidate', createCandidateValidator, createCandidate);
router.put('/:userId/candidate', updateCandidateValidator, updateCandidate);
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
