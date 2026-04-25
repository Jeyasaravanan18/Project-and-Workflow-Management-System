const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/AppError');

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));

        const message = errorMessages.map(e => `${e.field}: ${e.message}`).join(', ');

        return next(new ValidationError(message));
    }

    next();
};

module.exports = { validate };
