const { body } = require('express-validator');

const chatValidation = [
    body('message')
        .trim()
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
    body('conversationId')
        .optional()
        .isMongoId().withMessage('Invalid Conversation ID')
];

const documentValidation = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('type').isIn(['text', 'pdf', 'url']).withMessage('Invalid document type')
];

module.exports = {
    chatValidation,
    documentValidation
};
