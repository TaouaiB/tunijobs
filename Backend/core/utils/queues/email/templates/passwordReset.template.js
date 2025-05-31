/**
 * @file passwordReset.template.js
 * @description HTML + plain text template generator for password reset emails.
 */

const passwordResetTemplate = {
  /**
   * Generate HTML content for the email
   * @param {Object} payload - Template data (resetLink, firstName)
   * @returns {string}
   */
  html: ({ resetLink, firstName }) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${firstName || 'there'},</h2>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <p>
        <a href="${resetLink}" style="color: #1a73e8; text-decoration: none;">Reset your password</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <br/>
      <p>— Your Support Team</p>
    </div>
  `,

  /**
   * Generate plain text content (optional for email clients that don't support HTML)
   * @param {Object} payload - Template data
   * @returns {string}
   */
  text: ({ resetLink, firstName }) =>
    `Hello ${firstName || 'there'},\n\nYou requested to reset your password. Use the link below:\n${resetLink}\n\nIf you didn't request this, ignore this email.\n\n— Your Support Team`,
};

module.exports = passwordResetTemplate;
