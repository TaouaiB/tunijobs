const asyncHandler = require('express-async-handler');
const CandidateService = require('../services/candidate.service');

/**
 * @desc    Create candidate profile
 * @route   POST /api/v1/users/:userId/candidate
 * @access  Private
 */
exports.createCandidate = asyncHandler(async (req, res) => {
  const candidate = await CandidateService.createCandidate(
    req.params.userId,
    req.body
  );
  res.status(201).json({
    status: 'success',
    data: { candidate },
  });
});

/**
 * @desc    Get all candidates
 * @route   GET /api/v1/candidates
 * @access  Public
 */
exports.getAllCandidates = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.skills) {
    filters.skills = { $in: req.query.skills.split(',') };
  }

  const candidates = await CandidateService.getAllCandidates(filters, {
    sort: req.query.sort,
  });

  res.status(200).json({
    status: 'success',
    results: candidates.length,
    data: { candidates },
  });
});

/**
 * @desc    Get candidate by user ID
 * @route   GET /api/v1/users/:userId/candidate
 * @access  Public
 */
exports.getCandidateByUserId = asyncHandler(async (req, res) => {
  const candidate = await CandidateService.getByUserId(req.params.userId);
  res.status(200).json({
    status: 'success',
    data: { candidate },
  });
});

/**
 * @desc    Update candidate profile
 * @route   PATCH /api/v1/users/:userId/candidate
 * @access  Private
 */
exports.updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await CandidateService.updateByUserId(
    req.params.userId,
    req.body
  );
  res.status(200).json({
    status: 'success',
    data: { candidate },
  });
});

/**
 * @desc    Delete candidate by ID
 * @route   DELETE /api/v1/candidates/:id
 * @access  Private
 */
exports.deleteCandidate = asyncHandler(async (req, res) => {
  await CandidateService.deleteById(req.params.candidateId);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 * @desc    Delete candidate by user ID
 * @route   DELETE /api/v1/users/:userId/candidate
 * @access  Private
 */
exports.deleteCandidateByUserId = asyncHandler(async (req, res) => {
  await CandidateService.deleteByUserId(req.params.userId);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
