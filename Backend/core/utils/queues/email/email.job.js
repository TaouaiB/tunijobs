/**
 * Email Job payload structure
 * @typedef {Object} EmailJobData
 * @property {string} to - Recipient email address
 * @property {string} subject - Email subject line
 * @property {string} html - Email HTML content
 * @property {Object} [attachments] - Optional attachments
 */

/**
 * Helper to create an email job data object
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {Object} [attachments]
 * @returns {EmailJobData}
 */
function createEmailJobData(to, subject, html, attachments = null) {
  return { to, subject, html, attachments };
}

module.exports = {
  createEmailJobData,
};
