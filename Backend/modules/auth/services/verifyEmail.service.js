// Backend/modules/auth/services/verifyEmail.service.js

const asyncHandler = require('express-async-handler');
const jwt = require('../utils/jwt');
const User = require('../../user/models/userModel');
const ApiError = require('../../../core/utils/ApiError');

const verifyEmail = asyncHandler(async (token) => {
  if (!token) throw new ApiError(400, 'Token is missing');

  const decoded = jwt.verifyToken(token.trim());

  if (decoded.purpose !== 'verifyEmail') {
    throw new ApiError(400, 'Invalid token purpose');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.isVerified) {
    return { alreadyVerified: true, message: 'Email already verified' };
  }

  user.isVerified = true;
  await user.save();

  return { alreadyVerified: false, message: 'Email verified successfully' };
});

module.exports = { verifyEmail };
