/**
 * @file verificationEmail.template.js
 * @description HTML + plain text template generator for email verification emails.
 */

const verificationEmailTemplate = {
  /**
   * Generate HTML content for the verification email
   * @param {Object} payload - Template data (verificationLink, firstName)
   * @returns {string}
   */
  html: ({ verificationLink, firstName }) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>Hello ${firstName || 'there'},</h2>
      <p>Thank you for registering with us.</p>
      <p>Please verify your email address by clicking the button below:</p>
      <p>
        <a href="${verificationLink}" style="background-color:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
          Verify Email
        </a>
      </p>
      <p>If you did not sign up for this account, please ignore this email.</p>
      <br/>
      <p>— Your Support Team</p>
    </div>
  `,

  /**
   * Generate plain text content for the verification email
   * @param {Object} payload - Template data (verificationLink, firstName)
   * @returns {string}
   */
  text: ({ verificationLink, firstName }) =>
    `
Hello ${firstName || 'there'},

Thank you for registering with us.

Please verify your email by visiting this link:
${verificationLink}

If you did not sign up for this account, please ignore this email.

— Your Support Team
  `.trim(),
};

module.exports = verificationEmailTemplate;
