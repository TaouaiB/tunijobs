const jwt = require('../utils/jwt');
const EmailJobDispatcher = require('../../../core/utils/queues/email/email.job');
const logger = require('../../../core/utils/logger/logger');

/**
 * @class AuthNotificationService
 * @description Handles notification logic related to authentication (e.g., welcome emails, password resets)
 */
class AuthNotificationService {
  /**
   * Queue a welcome email to the user
   * @param {Object} user - The user object
   * @param {string} user.email - Email of the user
   * @param {string} user.firstName - First name for personalization
   */
  static async sendWelcomeEmail(user) {
    try {
      // Generate the verification token, passing payload and options object with expiresIn
      const token = jwt.signToken(
        { id: user._id, purpose: 'verifyEmail' },
        { expiresIn: '1d' }
      );
      // 2. Build verification link
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      await EmailJobDispatcher.sendWelcomeEmail(
        user.email,
        user.firstName,
        verificationLink
      );

      logger.info('📧 Welcome email job dispatched', { email: user.email });
    } catch (error) {
      logger.error('Failed to dispatch welcome email', {
        error: error.message,
        email: user.email,
      });
    }
  }

  /**
   * Queue a password reset email
   * @param {Object} user - The user object
   * @param {string} user.email - Email of the user
   * @param {string} resetToken - The password reset token
   */
  static async sendPasswordResetEmail(user, resetToken) {
    try {
      const jobData = {
        type: 'PASSWORD_RESET_EMAIL',
        to: user.email,
        subject: '🔐 Password Reset Instructions',
        template: 'passwordReset',
        payload: {
          resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
          firstName: user.firstName,
        },
      };

      await EmailJobDispatcher.dispatch(jobData);
      logger.info('📧 Password reset email job dispatched', {
        email: user.email,
      });
    } catch (error) {
      logger.error('Failed to dispatch password reset email', {
        error: error.message,
        email: user.email,
      });
    }
  }

  // to Add other notification methods as needed (e.g., email verification, login alert)
}

module.exports = AuthNotificationService;
