// core/utils/queues/email/email.processor.js
const transporter = require('./transporter');
const logger = require('../../logger/logger');
const ApiError = require('../../ApiError');

module.exports = async (job) => {
  console.log('📥 Received job in worker:', job.data);

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
};
