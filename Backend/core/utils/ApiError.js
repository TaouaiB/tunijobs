class ApiError extends Error {
  constructor(message, statusCode, metadata = {}) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
    this.isOperational = true;
    
    // Enhanced error classification
    this.type = metadata.type || 'operational';
    this.isCritical = metadata.isCritical || false;
    this.code = metadata.code; // Optional error code
    this.metadata = metadata.details; // Additional error context
    
    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
    
    // Auto-log critical errors during creation
    if (this.isCritical && process.env.NODE_ENV !== 'test') {
      console.error(`[CRITICAL] ${this.message}`, this);
    }
  }
  
  // Factory method for common error types
  static badRequest(message, metadata) {
    return new ApiError(message, 400, { ...metadata, type: 'validation' });
  }
  
  static unauthorized(message, metadata) {
    return new ApiError(message, 401, { ...metadata, type: 'authentication' });
  }
  
  static forbidden(message, metadata) {
    return new ApiError(message, 403, { ...metadata, type: 'authorization' });
  }
  
  static notFound(message, metadata) {
    return new ApiError(message, 404, { ...metadata, type: 'resource' });
  }
  
  static conflict(message, metadata) {
    return new ApiError(message, 409, { ...metadata, type: 'state' });
  }
  
  static internal(message, metadata) {
    return new ApiError(message, 500, { 
      ...metadata, 
      type: 'internal',
      isCritical: true 
    });
  }
}

module.exports = ApiError;