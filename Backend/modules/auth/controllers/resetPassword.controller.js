const asyncHandler = require('express-async-handler');
const PasswordResetService = require('../services/resetPassword.service');

const requestPasswordResetController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await PasswordResetService.requestPasswordReset(email);
  res.status(200).json(result);
});

const resetPasswordController = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await PasswordResetService.resetPassword(token, newPassword);
  res.status(200).json(result);
});

module.exports = {
  requestPasswordResetController,
  resetPasswordController,
};
