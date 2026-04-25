const { query } = require('express-validator');

const analyticsValidator = [
    query('projectId')
        .optional()
        .isMongoId().withMessage('Invalid Project ID'),
    query('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid ISO 8601 date')
        .toDate(),
    query('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid ISO 8601 date')
        .toDate()
];

module.exports = {
    analyticsValidator
};
