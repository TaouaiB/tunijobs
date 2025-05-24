const logger = require('../utils/logger/logger');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const packageJson = require('../../package.json');

class ErrorHandler {
  static init(app) {
    // Add request ID and start time to every request
    app.use((req, res, next) => {
      req.requestId = uuidv4();
      req.startTime = process.hrtime();
      res.setHeader('X-Request-ID', req.requestId);

      // Set X-Response-Time header before headers are sent
      res.once('header', () => {
        const responseTime = ErrorHandler._calculateResponseTime(req.startTime);
        res.setHeader('X-Response-Time', `${responseTime}ms`);
      });

      next();
    });

    // Log successful requests after response is finished
    app.use((req, res, next) => {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          const responseTime = ErrorHandler._calculateResponseTime(req.startTime);
          logger.info(
            'Request completed',
            ErrorHandler._createRequestMeta(req, res, responseTime)
          );
        }
      });
      next();
    });
  }

  static handle() {
    return (err, req, res, next) => {
      err.statusCode = err.statusCode || 500;
      err.status = err.status || 'error';
      err.requestId = req.requestId || uuidv4();

      ErrorHandler._classifyError(err);

      const responseTime = ErrorHandler._calculateResponseTime(req.startTime);
      const meta = ErrorHandler._createRequestMeta(req, res, responseTime, err);

      logger.error({
        message: err.message,
        ...meta,
        stack: err.stack,
        type: err.type,
        severity: err.isCritical ? 'CRITICAL' : 'ERROR',
      });

      if (!res.headersSent) {
        if (process.env.NODE_ENV === 'development') {
          ErrorHandler._sendDevelopmentError(err, res);
        } else {
          ErrorHandler._sendProductionError(err, res);
        }
      }

      if (err.isCritical) {
        ErrorHandler._triggerEmergencyProtocol(err, meta);
      }
    };
  }

  static _calculateResponseTime(startTime) {
    const diff = process.hrtime(startTime);
    return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
  }

  static _createRequestMeta(req, res, responseTime, err) {
    return {
      request: {
        id: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        referrer: req.get('referer'),
        params: req.params,
        query: req.query,
        body: ErrorHandler._sanitizeBody(req.body),
      },
      response: {
        statusCode: res.statusCode,
        timeMs: responseTime,
      },
      system: {
        hostname: os.hostname(),
        load: os.loadavg(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        appVersion: packageJson.version,
      },
      error:
        err
          ? {
              name: err.name,
              message: err.message,
              stack: err.stack,
              type: err.type,
              isOperational: err.isOperational,
              isCritical: err.isCritical,
            }
          : undefined,
    };
  }

  static _sanitizeBody(body) {
    if (!body) return null;
    const sanitized = { ...body };
    ['password', 'creditCard', 'token'].forEach((field) => {
      if (sanitized[field]) sanitized[field] = '**REDACTED**';
    });
    return sanitized;
  }

  static _classifyError(err) {
    if (err.name === 'MongoError' || err.name === 'SequelizeError') {
      err.type = 'database';
      err.isCritical = err.isCritical || err.code === 'ECONNREFUSED';
    }

    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      err.type = 'network';
      err.isCritical = true;
    }

    if (err.name === 'ValidationError') {
      err.type = 'validation';
      err.isOperational = true;
    }

    err.isOperational = err.isOperational || false;
    err.isCritical = err.isCritical || false;
    err.type = err.type || 'unclassified';
  }

  static _sendDevelopmentError(err, res) {
    res.status(err.statusCode).json({
      status: err.status,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
        type: err.type,
      },
      requestId: err.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  static _sendProductionError(err, res) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        type: err.type,
        requestId: err.requestId,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
        requestId: err.requestId,
        supportContact: 'support@yourdomain.com',
      });
    }
  }

  static _triggerEmergencyProtocol(err, meta) {
    logger.emergency('🚨 Triggering emergency protocol', {
      error: err.message,
    });
    // emergency actions here
  }
}

module.exports = ErrorHandler;
