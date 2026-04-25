const { body, query } = require('express-validator');

const createTaskValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('projectId')
        .isMongoId().withMessage('Invalid Project ID'),
    body('moduleId')
        .isMongoId().withMessage('Invalid Module ID'),
    body('assignedTo')
        .optional()
        .isArray().withMessage('Assigned To must be an array of User IDs')
        .custom((value) => {
            if (!value.every(id => /^[0-9a-fA-F]{24}$/.test(id))) {
                throw new Error('Invalid User ID in assignedTo list');
            }
            return true;
        }),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority level'),
    body('dueDate')
        .optional()
        .isISO8601().withMessage('Due date must be a valid ISO 8601 date')
        .toDate(),
    body('estimatedHours')
        .optional()
        .isFloat({ min: 0 }).withMessage('Estimated hours must be a positive number')
];

const updateTaskStatusValidation = [
    body('stageId')
        .isMongoId().withMessage('Invalid Stage ID')
];

const getTasksValidation = [
    query('projectId').optional().isMongoId().withMessage('Invalid Project ID'),
    query('moduleId').optional().isMongoId().withMessage('Invalid Module ID'),
    query('assignedTo').optional().isMongoId().withMessage('Invalid User ID')
];

module.exports = {
    createTaskValidation,
    updateTaskStatusValidation,
    getTasksValidation
};
