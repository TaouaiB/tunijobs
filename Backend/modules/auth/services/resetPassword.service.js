const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');
const User = require('../../user/models/userModel');
const AuthNotificationService = require('./authNotification.service');
const ApiError = require('../../../core/utils/ApiError');
const verifyPasswordResetTokenPayload = require('../../../core/utils/tokens/verifyPasswordResetTokenPayload');

class PasswordResetService {
  /**
   * Step 1: Request reset - generate token + send email
   */
  static async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User with this email not found');

    const resetToken = jwt.signToken(
      { id: user._id, purpose: 'passwordReset' },
      { expiresIn: '1h' }
    );

    await AuthNotificationService.sendPasswordResetEmail(user, resetToken);

    return { success: true, message: 'Password reset email sent' };
  }

  /**
   * Step 2: Reset password with token + new password
   */
  static async resetPassword(token, newPassword) {
    const decoded = verifyPasswordResetTokenPayload(token);

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(404, 'User not found');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    await user.save();

    return { success: true, message: 'Password reset successful' };
  }
}

module.exports = PasswordResetService;
