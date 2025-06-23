const { verifyToken } = require('../../../modules/auth/utils/jwt');
const UserService = require('../../../modules/user/services/user.service');
const Company = require('../../../modules/company/models/companyModel');
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

    // Load company associated with this user
    const company = await Company.findOne({ userId: user._id })
      .select('_id')
      .lean();

    // Attach normalized IDs to req.user
    req.user = {
      id: user._id.toString(),
      role: user.role,
      companyId: company?._id?.toString(),
      email: user.email,
    };

    next();
  } catch (err) {
    return next(new ApiError(err.message || 'Invalid token', 401));
  }
}

module.exports = authenticateJWT;