const express = require('express');
const router = express.Router({ mergeParams: true }); // Enable access to params from parent router if nested
const {
    getComments,
    createComment,
    updateComment,
    deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
    createCommentValidation,
    updateCommentValidation,
    commentIdValidation,
    taskIdValidation
} = require('../middleware/validators/commentValidator');

router.use(protect);

// Routes starting with /api/tasks/:taskId/comments
// Note: These will be mounted specifically or handled via root routes

// Get all comments for a task
router.get(
    '/tasks/:taskId/comments',
    taskIdValidation,
    validate,
    getComments
);

// Create a comment
router.post(
    '/tasks/:taskId/comments',
    createCommentValidation,
    validate,
    createComment
);

// Direct comment operations
router.patch(
    '/comments/:id',
    updateCommentValidation,
    validate,
    updateComment
);

router.delete(
    '/comments/:id',
    commentIdValidation,
    validate,
    deleteComment
);

module.exports = router;
