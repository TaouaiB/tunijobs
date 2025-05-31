// core/utils/queues/email/transporter.js
const nodemailer = require('nodemailer');
const logger = require('../../logger/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASSWORD || 'yourpassword',
  },
});

transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP connection failed:', error);
  } else {
    logger.info('SMTP server is ready to send messages');
  }
});

module.exports = transporter;
