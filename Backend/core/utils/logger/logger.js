const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`📁 Created logs directory at ${logDir}`);
}

// Transport creation helper
const createDailyRotateTransport = (filename, level) => {
  return new DailyRotateFile({
    filename: path.join(logDir, filename),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: level,
    format: combine(timestamp(), format.errors({ stack: true }), format.json()),
  });
};

const logger = createLogger({
  level: 'debug',
  format: combine(timestamp(), format.errors({ stack: true }), format.json()),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        printf(
          (info) =>
            `${info.timestamp} [${info.level}]: ${info.stack || info.message}`
        )
      ),
    }),
    createDailyRotateTransport('application-%DATE%.log', 'debug'), // Changed from 'info' to 'debug' to capture http logs
    createDailyRotateTransport('error-%DATE%.log', 'error'),
  ],
  exceptionHandlers: [
    createDailyRotateTransport('exceptions-%DATE%.log', 'error'),
  ],
  rejectionHandlers: [
    createDailyRotateTransport('rejections-%DATE%.log', 'error'),
  ],
  exitOnError: false,
});

// Verification logs
console.log('✅ Logger successfully configured with:');
logger.transports.forEach((t) =>
  console.log(`- ${t.name || t.constructor.name}`)
);

module.exports = logger;
