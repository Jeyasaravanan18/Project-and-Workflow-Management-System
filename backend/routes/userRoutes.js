const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    inviteUser,
    updateProfile,
    updateUserRole,
    updateUserStatus,
    removeUser,
    bulkInviteUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { createUserLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
    inviteUserValidation,
    bulkInviteValidation,
    getUsersValidation,
    userIdValidation,
    updateUserRoleValidation,
    updateProfileValidation
} = require('../middleware/validators/userValidator');

// All routes require authentication
router.use(protect);

// Online users in same organization (for sidebar presence indicator)
router.get('/online', async (req, res) => {
    try {
        const User = require('../models/User');
        // Staleness guard: treat users as offline if lastActive > 5 minutes ago
        // This catches missed disconnect events (nodemon restarts, crashes, etc.)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsers = await User.find({
            organizationId: req.user.organizationId,
            onlineStatus: 'online',
            lastActive: { $gte: fiveMinutesAgo },
            _id: { $ne: req.user._id }
        }).select('name email role onlineStatus lastActive').lean();
        res.json({ success: true, data: onlineUsers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Profile routes (any authenticated user)
router.patch('/profile', updateProfileValidation, validate, updateProfile);

// User management routes (Admin/Manager)
router.get(
    '/',
    authorize('admin', 'manager'),
    getUsersValidation,
    validate,
    getUsers
);

router.get(
    '/:id',
    userIdValidation,
    validate,
    getUserById
);

// Admin-only routes
router.post(
    '/invite',
    authorize('admin'),
    createUserLimiter,
    inviteUserValidation,
    validate,
    inviteUser
);

router.post(
    '/bulk-invite',
    authorize('admin'),
    createUserLimiter,
    bulkInviteValidation,
    validate,
    bulkInviteUsers
);

router.patch(
    '/:id/role',
    authorize('admin'),
    updateUserRoleValidation,
    validate,
    updateUserRole
);

router.patch(
    '/:id/status',
    authorize('admin'),
    userIdValidation,
    validate,
    updateUserStatus
);

router.delete(
    '/:id',
    authorize('admin'),
    userIdValidation,
    validate,
    removeUser
);

module.exports = router;
