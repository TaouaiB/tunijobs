// middlewares/requestLogger.js
const logger = require('../utils/logger/logger');

module.exports = (req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
};