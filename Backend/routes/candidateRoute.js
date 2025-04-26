const express = require('express');
const router = express.Router();

const {
  createCandidateValidator,
  updateCandidateValidator,
  getCandidateByUserIdValidator,
  deleteCandidateValidator,
} = require('../utils/validators/candidateValidator');
const {
  createCandidate,
  getAllCandidates,
  updateCandidate,
  deleteCandidate,
  getCandidateByUserId,
} = require('../services/candidateService');

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

module.exports = router;
