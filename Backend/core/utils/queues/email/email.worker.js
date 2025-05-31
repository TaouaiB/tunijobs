require('dotenv').config({ path: './config.env' });
const { Worker } = require('bullmq');
const EmailQueue = require('./email.queue');
const logger = require('../../logger/logger');
const ApiError = require('../../ApiError');
const transporter = require('./transporter');

const emailWorker = new Worker(
  EmailQueue.queueName,
  async (job) => {
    console.log('📥 Received job in worker:', job.data);

    console.log(`Worker started job ${job.id} with data:`, job.data);
    const { to, subject, html, attachments } = job.data;
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
        to,
        subject,
        html,
        attachments,
      });
      console.log('✅ Email sent:', info.messageId);
      console.log(`Email sent: ${info.messageId}`);
      logger.info(`Email sent to ${to}`, {
        messageId: info.messageId,
        jobId: job.id,
      });
      return info;
    } catch (err) {
      console.error(`Error sending email for job ${job.id}:`, err);
      const error = new ApiError(`Failed to send email to ${to}`, 500, {
        type: 'email',
        details: { originalError: err.message },
        isCritical: false,
      });
      logger.error(error.message, { error, jobId: job.id });
      throw error;
    }
  },
  {
    connection: EmailQueue.connection,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
  logger.info(`Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
  logger.error(`Email job ${job.id} failed`, { error: err.message });
});

module.exports = emailWorker;
