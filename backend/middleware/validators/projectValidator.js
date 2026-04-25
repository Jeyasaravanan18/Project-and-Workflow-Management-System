const { body, param, query } = require('express-validator');

/**
 * Validation for creating a project
 */
const createProjectValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Project name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Project name must be between 2 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),

    body('managerId')
        .optional()
        .isMongoId().withMessage('Invalid manager ID'),

    body('status')
        .optional()
        .isIn(['active', 'completed', 'on_hold', 'archived']).withMessage('Invalid status'),

    body('targetEndDate')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

/**
 * Validation for updating a project
 */
const updateProjectValidation = [
    param('id')
        .isMongoId().withMessage('Invalid project ID'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Project name must be between 2 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),

    body('status')
        .optional()
        .isIn(['active', 'completed', 'on_hold', 'archived']).withMessage('Invalid status'),

    body('targetEndDate')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

/**
 * Validation for project ID parameter
 */
const projectIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid project ID')
];

/**
 * Validation for getting projects list
 */
const getProjectsValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    query('status')
        .optional()
        .isIn(['active', 'completed', 'on_hold', 'archived']).withMessage('Invalid status filter'),

    query('managerId')
        .optional()
        .isMongoId().withMessage('Invalid manager ID')
];

/**
 * Validation for adding project member
 */
const addProjectMemberValidation = [
    param('id')
        .isMongoId().withMessage('Invalid project ID'),

    body('userId')
        .isMongoId().withMessage('Invalid user ID')
];

/**
 * Validation for removing project member
 */
const removeProjectMemberValidation = [
    param('id')
        .isMongoId().withMessage('Invalid project ID'),

    param('userId')
        .isMongoId().withMessage('Invalid user ID')
];

module.exports = {
    createProjectValidation,
    updateProjectValidation,
    projectIdValidation,
    getProjectsValidation,
    addProjectMemberValidation,
    removeProjectMemberValidation
};
