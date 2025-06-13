const asyncHandler = require('express-async-handler');
const { verifyEmail } = require('../services/verifyEmail.service');

const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;
  const result = await verifyEmail(token);

  if (result.alreadyVerified) {
    return res.status(200).json({ message: result.message });
  }

  return res.status(200).json({ message: result.message });
});

module.exports = { verifyEmailController };
