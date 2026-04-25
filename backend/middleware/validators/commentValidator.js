const { body, param } = require('express-validator');

const createCommentValidation = [
    param('taskId')
        .isMongoId().withMessage('Invalid task ID'),

    body('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ max: 5000 }).withMessage('Comment cannot exceed 5000 characters'),

    body('mentions')
        .optional()
        .isArray().withMessage('Mentions must be an array of user IDs')
];

const updateCommentValidation = [
    param('id')
        .isMongoId().withMessage('Invalid comment ID'),

    body('content')
        .trim()
        .notEmpty().withMessage('Comment content is required')
        .isLength({ max: 5000 }).withMessage('Comment cannot exceed 5000 characters')
];

const commentIdValidation = [
    param('id')
        .isMongoId().withMessage('Invalid comment ID')
];

const taskIdValidation = [
    param('taskId')
        .isMongoId().withMessage('Invalid task ID')
];

module.exports = {
    createCommentValidation,
    updateCommentValidation,
    commentIdValidation,
    taskIdValidation
};
