const logger = require('../utils/logger');
const { AppError } = require('../utils/AppError');

/**
 * Handle Mongoose CastError
 */
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle Mongoose Duplicate Key Error
 */
const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists. Please use another value.`;
    return new AppError(message, 409, 'DUPLICATE_FIELD');
};

/**
 * Handle Mongoose Validation Error
 */
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Handle JWT Error
 */
const handleJWTError = () => {
    return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

/**
 * Handle JWT Expired Error
 */
const handleJWTExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userId: req.user?._id
    });

    res.status(err.statusCode || 500).json({
        success: false,
        error: {
            message: err.message,
            code: err.errorCode || 'INTERNAL_ERROR',
            statusCode: err.statusCode,
            stack: err.stack,
            error: err
        }
    });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.error('Operational Error:', {
            message: err.message,
            code: err.errorCode,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id
        });

        res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                code: err.errorCode
            }
        });
    }
    // Programming or unknown error: don't leak error details
    else {
        logger.error('Programming Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userId: req.user?._id
        });

        res.status(500).json({
            success: false,
            error: {
                message: 'Something went wrong. Please try again later.',
                code: 'INTERNAL_ERROR'
            }
        });
    }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.errorCode = err.errorCode || 'INTERNAL_ERROR';

    // Mongoose bad ObjectId
    if (err.name === 'CastError') error = handleCastErrorDB(err);

    // Mongoose duplicate key
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    // Mongoose validation error
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

    // JWT errors
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Send response based on environment
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, req, res);
    } else {
        sendErrorProd(error, req, res);
    }
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = { errorHandler, catchAsync };
