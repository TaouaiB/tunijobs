const asyncHandler = require('express-async-handler');

const ApiError = require('../../../core/utils/apiError');
const pickFields = require('../../../core/utils/pickFields');

const User = require('../../user/models/userModel');
const Candidate = require('../models/candidateModel');

/*--------------------------------------------------
  Candidate Profile Management (All User-ID Based)
---------------------------------------------------*/

// @desc    Create candidate profile
// @route   POST /api/v1/users/:userId/candidate
// @access  Private
exports.createCandidate = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // 1) Verify user exists
  if (!(await User.exists({ _id: userId }))) {
    return next(new ApiError(`User ${userId} not found`, 404));
  }

  // 2) Prevent duplicate profiles
  if (await Candidate.exists({ userId })) {
    return next(new ApiError(`Candidate profile already exists`, 409));
  }

  // 3) Create with filtered fields
  const candidate = await Candidate.create({
    ...pickFields(req.body, 'candidate', true), // Strict mode enabled
    userId,
  }).then((doc) => doc.populate('userId', 'name _id'));

  res.status(201).json({
    status: 'success',
    data: { candidate },
  });
});

// @desc   Get all candidates
// @route  GET /api/v1/users/candidates
// @access Public
exports.getAllCandidates = asyncHandler(async (req, res, next) => {
  const candidates = await Candidate.find({}).populate({
    path: 'userId',
    select: 'name _id',
  });

  res.status(200).json({
    status: 'success',
    results: candidates.length,
    data: {
      candidates,
    },
  });
});

// @desc    Get candidate profile
// @route   GET /api/v1/users/:userId/candidate
// @access  Public
exports.getCandidateByUserId = asyncHandler(async (req, res, next) => {
  const candidate = await Candidate.findOne({
    userId: req.params.userId,
  }).populate('userId', 'name _id');

  if (!candidate) {
    return next(
      new ApiError(`No candidate found for user id: ${req.params.userId}`, 404)
    );
  }

  res.status(200).json({
    status: 'success',
    data: { candidate },
  });
});

// @desc    Update candidate profile
// @route   PUT /api/v1/users/:userId/candidate
// @access  Private
exports.updateCandidate = asyncHandler(async (req, res, next) => {
  const candidate = await Candidate.findOneAndUpdate(
    { userId: req.params.userId },
    pickFields(req.body, 'candidate', true), // Strict mode
    { new: true }
  ).populate('userId', 'name _id');

  if (!candidate) {
    return next(new ApiError(`No candidate found for user id: ${userId}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: { candidate },
  });
});

// @desc    Delete candidate profile bases on candidateId
// @route   DELETE /api/v1/users/candidate/candidateId
// @access  Private
exports.deleteCandidate = asyncHandler(async (req, res, next) => {
  const { candidateId } = req.params;
  const candidate = await Candidate.findByIdAndDelete(candidateId);

  if (!candidate) {
    return next(new ApiError(`No candidate found`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Delete candidate profile bases on userId
// @route   DELETE /api/v1/users/:userId/candidate
// @access  Private
exports.deleteCandidateByUserId = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const candidate = await Candidate.findOneAndDelete(userId);

  if (!candidate) {
    return next(new ApiError(`No candidate found for user id: ${userId}`, 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
