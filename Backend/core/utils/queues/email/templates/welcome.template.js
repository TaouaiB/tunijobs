/**
 * @file welcome.template.js
 * @description HTML + plain text template generator for welcome emails with verification link.
 */

const welcomeTemplate = {
  /**
   * Generate HTML content for the welcome email
   * @param {Object} payload - Template data (verificationLink, firstName)
   * @returns {string}
   */
  html: ({ verificationLink, firstName }) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Welcome ${firstName || 'there'}! 🎉</h2>
      <p>Thanks for joining us. Please confirm your email address by clicking the link below:</p>
      <p>
        <a href="${verificationLink}" style="background-color:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
      </p>
      <p>If you did not create this account, you can safely ignore this email.</p>
      <br/>
      <p>— Your Support Team</p>
    </div>
  `,

  /**
   * Generate plain text content for the welcome email
   * @param {Object} payload - Template data (verificationLink, firstName)
   * @returns {string}
   */
  text: ({ verificationLink, firstName }) =>
    `Welcome ${firstName || 'there'}!\n\nPlease confirm your email by visiting this link:\n${verificationLink}\n\nIf you didn't create this account, ignore this email.\n\n— Your Support Team`,
};

module.exports = welcomeTemplate;
