const jwt = require('../utils/jwt');
const User = require('../../user/models/userModel');
const ApiError = require('../../../core/utils/ApiError');
const expressAsyncHandler = require('express-async-handler');

const verifyEmailToken = expressAsyncHandler(async (token) => {
  if (!token) throw new ApiError(400, 'Token is missing');

  const decoded = jwt.verifyToken(token.trim());

  if (decoded.purpose !== 'verifyEmail') {
    throw new ApiError(400, 'Invalid token purpose');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (user.isVerified) {
    return { success: true, message: 'Email already verified' };
  }

  user.isVerified = true;
  await user.save();

  return { success: true, message: 'Email verified successfully' };
});

module.exports = { verifyEmailToken };
