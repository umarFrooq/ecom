// Simple Error Handler (can be expanded)
// This should be the last middleware, loaded after all routes.

// Custom Error Response class (optional but good for standardization)
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}


const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.error('ERROR STACK:', err.stack ? err.stack.red : err.toString().red);
  console.error('ERROR:', JSON.stringify(error, null, 2).red);


  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}. Invalid ID format.`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate field value entered: '${value}' for field '${field}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error (ValidationError)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Invalid input data. ${messages.join('. ')}`;
    error = new ErrorResponse(message, 400);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Not authorized, token failed (invalid token).';
    error = new ErrorResponse(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Not authorized, token expired.';
    error = new ErrorResponse(message, 401);
  }


  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = { errorHandler, ErrorResponse}; // Export ErrorResponse if you want to use it in controllers for specific errors.
