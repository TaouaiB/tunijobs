// Backend/modules/auth/services/verifyEmail.service.js

const asyncHandler = require('express-async-handler');
const User = require('../../user/models/userModel');
const ApiError = require('../../../core/utils/ApiError');
const verifyEmailTokenPayload = require('../../../core/utils/tokens/verifyEmailTokenPayload');

const verifyEmail = asyncHandler(async (token) => {
  const decoded = verifyEmailTokenPayload(token);

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
