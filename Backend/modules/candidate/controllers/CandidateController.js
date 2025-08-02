const asyncHandler = require('express-async-handler');
const CandidateService = require('../services/candidate.service');
const documentUploadHandler = require('../../../core/middlewares/multer/documentUploadHandler');

/**
 * @desc    Create candidate profile
 * @route   POST /api/v1/users/:userId/candidate
 * @access  Private
 */
exports.createCandidate = [
  documentUploadHandler({ allowNoFiles: true }),
  asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const candidate = await CandidateService.createCandidate(
      userId,
      req.body,
      req.documentInfo
    );
    res.status(201).json({
      status: 'success',
      data: { candidate },
    });
  }),
];

/**
 * @desc    Upload and update candidate resume
 * @route   POST /api/v1/users/:userId/candidate/resume
 * @access  Private
 */
exports.updateResume = [
  documentUploadHandler({ allowNoFiles: false }),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const candidateId = req.user.candidateId;

    if (!candidateId) {
      throw new ApiError('No candidate profile exists for this user', 404);
    }

    if (!req.documentInfo || typeof req.documentInfo !== 'object') {
      throw new ApiError('Invalid file data received', 400);
    }

    console.log('Processing resume for:', {
      userId,
      candidateId,
      documentInfo: req.documentInfo,
    });

    const candidate = await CandidateService.storeResume(
      userId,
      req.documentInfo
    );

    res.status(200).json({
      status: 'success',
      data: { candidate },
    });
  }),
];

/**
 * @desc    Remove candidate resume
 * @route   PATCH /api/v1/users/:userId/candidate/remove-resume
 * @access  Private
 */
exports.removeResume = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const candidateId = req.user.candidateId;

  if (!candidateId) {
    throw new ApiError('No candidate profile exists for this user', 404);
  }
  const updatedCandidate = await CandidateService.removeResume(userId);

  res.status(200).json({
    status: 'success',
    data: { candidate: updatedCandidate },
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
  const userId = req.user?.id || req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  const candidate = await CandidateService.getByUserId(userId);
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
  const userId = req.user?.id || req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  const candidate = await CandidateService.updateByUserId(userId, req.body);
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
  const candidateId = req.user?.candidateId || req.params.id;
  console.log('Deleting candidate profile :', candidateId);

  if (!candidateId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  await CandidateService.deleteById(candidateId);
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
  const userId = req.user?.id || req.params.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  await CandidateService.deleteByUserId(userId);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
