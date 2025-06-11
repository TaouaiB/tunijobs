const asyncHandler = require('express-async-handler');
const { verifyEmailToken } = require('../services/emailVerification.service');

const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await verifyEmailToken(token);

  if (result.alreadyVerified) {
    return res.status(200).json({ message: result.message });
  }

  return res.status(200).json({ message: result.message });
});

module.exports = { verifyEmailController };
