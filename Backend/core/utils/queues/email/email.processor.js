const transporter = require('./transporter');
const logger = require('../../logger/logger');
const ApiError = require('../../ApiError');
const { getTemplate } = require('./templates');

module.exports = async (job) => {
  console.log('📥 Received job in worker:', job.data);

  const { to, subject, html, text, template, payload, attachments } = job.data;

  let finalHtml = html;
  let finalText = text;

  // If no pre-rendered html/text, but template + payload provided, render it now
  if ((!finalHtml || !finalText) && template && payload) {
    try {
      const tmpl = getTemplate(template);
      finalHtml = tmpl.html(payload);
      finalText = tmpl.text(payload);
    } catch (err) {
      console.error('Error rendering email template:', err);
      throw new ApiError('Failed to render email template', 500, {
        originalError: err.message,
      });
    }
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"No Reply" <noreply@example.com>',
      to,
      subject,
      html: finalHtml,
      text: finalText,
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
