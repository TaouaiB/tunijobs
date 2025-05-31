// core/utils/queues/email/email.job.js
const EmailQueue = require('./email.queue');
const logger = require('../../logger/logger');

class EmailJobDispatcher {
  static async dispatch(jobData) {
    try {
      await EmailQueue.addJob('send_email', jobData);
      console.log(`Added job to email queue for ${jobData.to}`);
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
