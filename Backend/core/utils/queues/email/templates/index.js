/**
 * @file index.js
 * @description Central dispatcher for email templates.
 */

const passwordResetTemplate = require('./passwordReset.template');

const templates = {
  passwordReset: passwordResetTemplate,
  // Add other templates here later (e.g., 'welcome': require('./welcome.template'))
};

/**
 * Get the email template by key.
 * @param {string} templateName
 * @returns {{ html: Function, text: Function }} Template object with html/text generators
 */
function getTemplate(templateName) {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Unknown email template: "${templateName}"`);
  }
  return template;
}

module.exports = {
  getTemplate,
};
