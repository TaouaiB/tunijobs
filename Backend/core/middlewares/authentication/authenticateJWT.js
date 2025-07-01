const { verifyToken } = require('../../../modules/auth/utils/jwt');
const UserService = require('../../../modules/user/services/user.service');
const Company = require('../../../modules/company/models/companyModel');
const Candidate = require('../../../modules/candidate/models/candidateModel');
const ApiError = require('../../utils/ApiError');
const { Types } = require('mongoose');

async function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError('No token provided', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Load user from DB
    const user = await UserService.getUserById(decoded.id);
    if (!user) {
      return next(new ApiError('User not found', 404));
    }

    // ONLY CHANGE: Get candidateId for jobSeekers
    let candidateId;
    if (user.role === 'jobSeeker') {
      const candidate = await Candidate.findOne({ userId: user._id });
      candidateId = candidate?._id?.toString(); // Will be undefined if not found
    }

    // Load company associated with this user
    const company = await Company.findOne({ userId: user._id })
      .select('_id')
      .lean();

    // Attach normalized IDs to req.user
    req.user = {
      id: user._id.toString(),
      role: user.role,
      companyId: company?._id?.toString(),
      candidateId,
      email: user.email,
    };

    console.log('[DEBUG] Authenticated user:', req.user);

    next();
  } catch (err) {
    return next(new ApiError(err.message || 'Invalid token', 401));
  }
}

module.exports = authenticateJWT;
