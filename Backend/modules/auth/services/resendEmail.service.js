// modules/auth/services/resendEmail.service.js

const User = require('../../user/models/userModel');
const jwt = require('../utils/jwt');
const EmailJobDispatcher = require('../../../core/utils/queues/email/email.job');
const logger = require('../../../core/utils/logger/logger');

const MAX_RESEND_ATTEMPTS = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function resendVerificationEmail(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  if (user.isVerified) throw new Error('User already verified');

  const now = Date.now();

  if (
    user.verificationResendTimestamp &&
    now - user.verificationResendTimestamp < RESEND_WINDOW_MS &&
    user.verificationResendCount >= MAX_RESEND_ATTEMPTS
  ) {
    throw new Error('Too many resend attempts. Try again later.');
  }

  // Generate new token for email verification
  const token = jwt.signToken(
    { id: user._id, purpose: 'verifyEmail' },
    { expiresIn: '1h' }
  );

  // Compose verification link
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  // Dispatch email job via your EmailJobDispatcher
  await EmailJobDispatcher.dispatch({
    type: 'VERIFICATION_EMAIL',
    to: user.email,
    subject: 'Please verify your email',
    template: 'verificationEmail', // match your template name
    payload: {
      verificationLink,
      firstName: user.firstName,
    },
  });

  // Update resend counters & timestamp
  if (
    !user.verificationResendTimestamp ||
    now - user.verificationResendTimestamp > RESEND_WINDOW_MS
  ) {
    user.verificationResendCount = 1;
  } else {
    user.verificationResendCount = (user.verificationResendCount || 0) + 1;
  }
  user.verificationResendTimestamp = now;
  await user.save();

  return { message: 'Verification email resent' };
}

async function resendPasswordResetEmail(email) {
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  const now = Date.now();

  if (
    user.passwordResetResendTimestamp &&
    now - user.passwordResetResendTimestamp < RESEND_WINDOW_MS &&
    user.passwordResetResendCount >= MAX_RESEND_ATTEMPTS
  ) {
    throw new Error('Too many resend attempts. Try again later.');
  }

  // Generate token for password reset
  const token = jwt.signToken(
    { id: user._id, purpose: 'passwordReset' },
    { expiresIn: '1h' }
  );

  // Compose reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // Dispatch password reset email job
  await EmailJobDispatcher.dispatch({
    type: 'PASSWORD_RESET_EMAIL',
    to: user.email,
    subject: '🔐 Password Reset Instructions',
    template: 'passwordReset', // match your template name
    payload: {
      resetLink,
      firstName: user.firstName,
    },
  });

  if (
    !user.passwordResetResendTimestamp ||
    now - user.passwordResetResendTimestamp > RESEND_WINDOW_MS
  ) {
    user.passwordResetResendCount = 1;
  } else {
    user.passwordResetResendCount = (user.passwordResetResendCount || 0) + 1;
  }
  user.passwordResetResendTimestamp = now;
  await user.save();

  return { message: 'Password reset email resent' };
}

module.exports = {
  resendVerificationEmail,
  resendPasswordResetEmail,
};
