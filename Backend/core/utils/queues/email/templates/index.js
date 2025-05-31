/**
 * @file index.js
 * @description Central dispatcher for email templates.
 */

const passwordResetTemplate = require('./passwordReset.template');

const welcomeTemplate = require('./welcome.template');

const templates = {
  passwordReset: passwordResetTemplate,
  welcome: welcomeTemplate,
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
