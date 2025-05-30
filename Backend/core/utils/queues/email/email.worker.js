const { Worker } = require('bullmq');
const EmailQueue = require('./email.queue');
const logger = require('../../logger/logger');
const ApiError = require('../../ApiError');
const nodemailer = require('nodemailer');

// Configure your SMTP transporter here (replace with real config)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true for 465
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
  },
});

const emailWorker = new Worker(
  EmailQueue.queueName,
  async (job) => {
    const { to, subject, html, attachments } = job.data;
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"No Reply" <noreply@example.com>',
        to,
        subject,
        html,
        attachments,
      });
      logger.info(`Email sent to ${to}`, {
        messageId: info.messageId,
        jobId: job.id,
      });
      return info;
    } catch (err) {
      const error = new ApiError(`Failed to send email to ${to}`, 500, {
        type: 'email',
        details: { originalError: err.message },
        isCritical: false,
      });
      logger.error(error.message, { error, jobId: job.id });
      throw error; // rethrow to mark job as failed
    }
  },
  {
    connection: EmailQueue.connection,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job.id} failed`, { error: err.message });
});

module.exports = emailWorker;
