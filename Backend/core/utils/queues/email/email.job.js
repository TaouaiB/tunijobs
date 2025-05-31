// core/utils/queues/email/email.job.js
const EmailQueue = require('./email.queue');
const logger = require('../../logger/logger');
const { getTemplate } = require('./templates');

class EmailJobDispatcher {
  static async sendWelcomeEmail(to, firstName, verificationLink) {
    const template = getTemplate('welcome');
    const html = template.html({ firstName, verificationLink });
    const text = template.text({ firstName, verificationLink });

    const jobData = {
      to,
      subject: `🎉 Welcome ${firstName || 'there'}! Please verify your email`,
      html,
      text,
      type: 'WELCOME_EMAIL',
    };

    return this.dispatch(jobData);
  }

  static async dispatch(jobData) {
    try {
      await EmailQueue.addJob('send_email', jobData);
      logger.info('Email job added to queue', {
        to: jobData.to,
        type: jobData.type,
      });
    } catch (error) {
      logger.error('Failed to add email job to queue', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = EmailJobDispatcher;
