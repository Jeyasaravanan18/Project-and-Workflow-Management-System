const { body, param, query } = require('express-validator');

/**
 * Validation for inviting a user
 */
const inviteUserValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'manager', 'member']).withMessage('Invalid role. Must be admin, manager, or member')
];

/**
 * Validation for bulk inviting users
 */
const bulkInviteValidation = [
    body('users').isArray({ min: 1, max: 50 }).withMessage('Users array must be between 1 and 50'),
    body('users.*.email').trim().notEmpty().isEmail().normalizeEmail(),
    body('users.*.name').trim().notEmpty().withMessage('Name is required for all users'),
    body('users.*.role').isIn(['manager', 'member']).withMessage('Role must be manager or member')
];

/**
 * Validation for updating user profile
 */
const updateProfileValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters')
];

/**
 * Validation for user ID parameter
 */
const userIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid user ID')
];

/**
 * Validation for getting users list
 */
const getUsersValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('role')
        .optional()
        .isIn(['admin', 'manager', 'member']).withMessage('Invalid role filter'),

    query('status')
        .optional()
        .isIn(['active', 'pending']).withMessage('Invalid status filter')
];

/**
 * Validation for updating user role
 */
const updateUserRoleValidation = [
    param('id')
        .isMongoId().withMessage('Invalid user ID'),

    body('role')
        .notEmpty().withMessage('Role is required'),
    body('role').isIn(['admin', 'manager', 'member']).withMessage('Invalid role')
];

module.exports = {
    inviteUserValidation,
    bulkInviteValidation,
    getUsersValidation,
    userIdValidation,
    updateUserRoleValidation,
    updateProfileValidation
};
