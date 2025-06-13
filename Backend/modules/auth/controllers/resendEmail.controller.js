// modules/auth/controllers/resendEmail.controller.js
const resendEmailService = require('../services/resendEmail.service');

async function resendVerificationEmailHandler(req, res) {
  try {
    const { email } = req.body;
    const result = await resendEmailService.resendVerificationEmail(email);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function resendPasswordResetEmailHandler(req, res) {
  try {
    const { email } = req.body;
    const result = await resendEmailService.resendPasswordResetEmail(email);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  resendVerificationEmailHandler,
  resendPasswordResetEmailHandler,
};
