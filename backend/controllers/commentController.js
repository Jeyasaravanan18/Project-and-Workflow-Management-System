const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, AuthorizationError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @desc    Get comments for a task
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private
 */
const getComments = catchAsync(async (req, res) => {
    const comments = await Comment.find({ taskId: req.params.taskId })
        .populate('userId', 'name email avatar')
        .populate('mentions', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        success: true,
        data: comments
    });
});

/**
 * @desc    Create a comment
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private
 */
const createComment = catchAsync(async (req, res) => {
    const { content, mentions } = req.body;
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
        throw new NotFoundError('Task not found');
    }

    const comment = await Comment.create({
        taskId,
        userId: req.user._id,
        content,
        mentions: mentions || []
    });

    // Populate user data
    await comment.populate('userId', 'name email avatar');

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
        // Filter users who have in-app notifications enabled
        const usersToNotify = await User.find({
            _id: { $in: mentions },
            'preferences.notifications.inApp': true
        }).select('_id');

        const notifyIds = usersToNotify.map(u => u._id);

        if (notifyIds.length > 0) {
            const notifications = notifyIds.map(userId => ({
                userId,
                type: 'mention',
                message: `${req.user.name} mentioned you in a comment`,
                relatedEntity: {
                    model: 'Task',
                    id: taskId
                }
            }));

            await Notification.insertMany(notifications);

            // Emit Socket.IO event for real-time notifications
            const io = req.app.get('io');
            notifyIds.forEach(userId => {
                io.to(userId.toString()).emit('notification', {
                    type: 'mention',
                    message: `${req.user.name} mentioned you in a comment`,
                    taskId
                });
            });
        }
    }

    logger.info('Comment created', { commentId: comment._id, taskId, userId: req.user._id });

    res.status(201).json({
        success: true,
        data: comment
    });
});

/**
 * @desc    Update a comment
 * @route   PATCH /api/comments/:id
 * @access  Private
 */
const updateComment = catchAsync(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        throw new NotFoundError('Comment not found');
    }

    // Check ownership
    if (comment.userId.toString() !== req.user._id.toString()) {
        throw new AuthorizationError('You can only edit your own comments');
    }

    comment.content = req.body.content || comment.content;
    comment.edited = true;
    comment.editedAt = new Date();

    await comment.save();
    await comment.populate('userId', 'name email avatar');

    res.json({
        success: true,
        data: comment
    });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const deleteComment = catchAsync(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        throw new NotFoundError('Comment not found');
    }

    // Check ownership or admin
    if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new AuthorizationError('You can only delete your own comments');
    }

    await comment.deleteOne();

    logger.info('Comment deleted', { commentId: comment._id, userId: req.user._id });

    res.json({
        success: true,
        message: 'Comment deleted successfully'
    });
});

module.exports = {
    getComments,
    createComment,
    updateComment,
    deleteComment
};
