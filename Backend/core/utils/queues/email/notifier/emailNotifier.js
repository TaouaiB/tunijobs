/**
 * @class EmailNotifier
 * @description Handles dynamic email sending with templates via nodemailer.
 */

const transporter = require('./transporter');
const { getTemplate } = require('../templates');
const logger = require('../../../logger/logger');

class EmailNotifier {
  /**
   * Send an email using the given job data.
   * @param {Object} data - Email job data.
   * @param {string} data.to - Recipient email address.
   * @param {string} data.subject - Email subject.
   * @param {string} data.template - Template key name.
   * @param {Object} data.payload - Data for template rendering.
   */
  static async send(data) {
    try {
      const { to, subject, template, payload = {} } = data;

      // Get the appropriate template
      const tpl = getTemplate(template);
      const html = tpl.html(payload);
      const text = tpl.text(payload);

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"MyApp" <no-reply@myapp.com>',
        to,
        subject,
        text,
        html,
      };

      // Send the email
      const info = await transporter.sendMail(mailOptions);

      logger.info('📧 Email sent', {
        to,
        subject,
        messageId: info.messageId,
      });

      return info;
    } catch (err) {
      logger.error('❌ Failed to send email', {
        error: err.message,
        jobData: data,
      });
      throw err;
    }
  }
}

module.exports = EmailNotifier;
