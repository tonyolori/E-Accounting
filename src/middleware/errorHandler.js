/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || null;

  // Handle specific error types
  if (error.name === 'PrismaClientKnownRequestError') {
    ({ statusCode, message, code } = handlePrismaError(error));
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = formatValidationError(error);
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'AUTH_TOKEN_INVALID';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
    code = 'AUTH_TOKEN_EXPIRED';
  }

  // Log error details
  logError(error, req, statusCode);

  // Format error response
  const errorResponse = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(req.method && { method: req.method }),
    ...(req.path && { path: req.path })
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle Prisma database errors
 * @param {Error} error - Prisma error object
 * @returns {Object} Formatted error details
 */
function handlePrismaError(error) {
  let statusCode = 500;
  let message = 'Database error';
  let code = 'DATABASE_ERROR';

  switch (error.code) {
    case 'P2002':
      statusCode = 409;
      message = 'A record with this data already exists';
      code = 'DUPLICATE_RECORD';
      
      // Extract field name from meta if available
      if (error.meta?.target) {
        const field = error.meta.target[0];
        if (field === 'email') {
          message = 'An account with this email already exists';
        } else {
          message = `A record with this ${field} already exists`;
        }
      }
      break;
      
    case 'P2025':
      statusCode = 404;
      message = 'Record not found';
      code = 'RECORD_NOT_FOUND';
      break;
      
    case 'P2003':
      statusCode = 400;
      message = 'Invalid reference - related record not found';
      code = 'INVALID_REFERENCE';
      break;
      
    case 'P2014':
      statusCode = 400;
      message = 'Invalid data - constraint violation';
      code = 'CONSTRAINT_VIOLATION';
      break;
      
    default:
      statusCode = 500;
      message = 'Database operation failed';
      code = 'DATABASE_ERROR';
  }

  return { statusCode, message, code };
}

/**
 * Format validation error messages
 * @param {Error} error - Validation error object
 * @returns {string} Formatted error message
 */
function formatValidationError(error) {
  if (error.details && Array.isArray(error.details)) {
    return error.details.map(detail => detail.message).join(', ');
  }
  
  return error.message || 'Validation failed';
}

/**
 * Log error details
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {number} statusCode - HTTP status code
 */
function logError(error, req, statusCode) {
  const logLevel = statusCode >= 500 ? 'ERROR' : 'WARN';
  const timestamp = new Date().toISOString();
  
  const logData = {
    timestamp,
    level: logLevel,
    message: error.message,
    statusCode,
    method: req?.method,
    url: req?.originalUrl,
    userAgent: req?.headers?.['user-agent'],
    ip: req?.ip || req?.connection?.remoteAddress,
    userId: req?.user?.id
  };

  // Log based on environment
  if (process.env.NODE_ENV === 'production') {
    // In production, you might want to use a proper logging service
    console.log(JSON.stringify(logData));
  } else {
    // Development logging with more details
    console.log(`\n[${logLevel}] ${timestamp}`);
    console.log(`Request: ${logData.method} ${logData.url}`);
    console.log(`Error: ${error.message}`);
    console.log(`Status: ${statusCode}`);
    
    if (statusCode >= 500) {
      console.log(`Stack: ${error.stack}`);
    }
    console.log('---');
  }
}

/**
 * Handle async route errors - wraps async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  next(error);
}

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
  handlePrismaError,
  formatValidationError
};
