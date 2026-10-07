const User = require('../models/User');
const Task = require('../models/Task');
const { logActivity } = require('../services/activityLogger');
const { catchAsync } = require('../middleware/errorHandler');
const { parsePaginationParams, applyPagination } = require('../utils/pagination');
const { NotFoundError, AuthorizationError, ValidationError, ConflictError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @desc    Get all users in organization with pagination
 * @route   GET /api/users
 * @access  Private (Admin/Manager)
 */
const getUsers = catchAsync(async (req, res) => {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const { role, status, search } = req.query;

    // Build filter
    const filter = { organizationId: req.user.organizationId };
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
        filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    // Get paginated users
    const query = User.find(filter)
        .select('-password -invitationToken')
        .lean();

    const result = await applyPagination(query, User, page, limit, skip, sort);

    // Get task counts for each user
    const usersWithStats = await Promise.all(
        result.data.map(async (user) => {
            const taskStats = await Task.aggregate([
                { $match: { assignedTo: user._id } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] }
                        }
                    }
                }
            ]);

            const stats = taskStats[0] || { total: 0, completed: 0 };

            return {
                ...user,
                taskStats: stats
            };
        })
    );

    res.json({
        success: true,
        data: usersWithStats,
        pagination: result.pagination
    });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password -invitationToken')
        .lean();

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Check same organization
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
        throw new AuthorizationError('Not authorized to view this user');
    }

    // Get task statistics
    const taskStats = await Task.aggregate([
        { $match: { assignedTo: user._id } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] } },
                overdue: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $lt: ['$dueDate', new Date()] },
                                    { $eq: ['$completedAt', null] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const stats = taskStats[0] || { total: 0, completed: 0, overdue: 0 };

    res.json({
        success: true,
        data: {
            ...user,
            taskStats: stats
        }
    });
});

/**
 * @desc    Invite user (Create new user)
 * @route   POST /api/users/invite
 * @access  Private (Admin)
 */
const inviteUser = catchAsync(async (req, res) => {
    const { name, email, role } = req.body;
    const crypto = require('crypto');
    const { sendInvitationEmail } = require('../services/emailService');
    const Organization = require('../models/Organization');

    // Validate role
    if (role === 'admin') {
        throw new ValidationError('Cannot create admin users via invitation');
    }

    if (!['manager', 'member'].includes(role)) {
        throw new ValidationError('Role must be either "manager" or "member"');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ConflictError('User with this email already exists');
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create user
    const user = await User.create({
        name,
        email,
        role,
        organizationId: req.user.organizationId,
        status: 'pending',
        invitationToken,
        invitationExpires
    });

    // Get organization
    const frontendBase = process.env.FRONTEND_URL || process.env.FRONTEND_URI || 'http://localhost:5173';
    const invitationLink = `${frontendBase}/accept-invitation/${invitationToken}`;

    // Send invitation email
    try {
        await sendInvitationEmail({
            to: email,
            userName: name,
            organizationName: organization.name,
            invitationLink,
            role
        });

        logger.info('User invited', { userId: user._id, email, role, invitedBy: req.user._id });
    } catch (emailError) {
        await User.findByIdAndDelete(user._id);
        logger.error('Failed to send invitation email', { error: emailError.message });
        throw new Error('Failed to send invitation email. Please check email configuration.');
    }

    await logActivity(req.user._id, 'INVITED_USER', 'User', user._id, { role: user.role }, req.user.organizationId);

    res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    });
});

/**
 * @desc    Update user profile
 * @route   PATCH /api/users/profile
 * @access  Private
 */
const updateProfile = catchAsync(async (req, res) => {
    const { name, bio, avatar, preferences } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;
    if (preferences) {
        user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    logger.info('Profile updated', { userId: user._id });

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            bio: user.bio,
            avatar: user.avatar,
            preferences: user.preferences
        }
    });
});

/**
 * @desc    Update user role
 * @route   PATCH /api/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = catchAsync(async (req, res) => {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Check same organization
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
        throw new AuthorizationError('Not authorized');
    }

    // Cannot change own role
    if (user._id.toString() === req.user._id.toString()) {
        throw new ValidationError('You cannot change your own role');
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logActivity(req.user._id, 'UPDATED_USER_ROLE', 'User', user._id, {
        oldRole,
        newRole: role
    }, req.user.organizationId);

    logger.info('User role updated', { userId: user._id, oldRole, newRole: role });

    res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
const updateUserStatus = catchAsync(async (req, res) => {
    const { status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Check same organization
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
        throw new AuthorizationError('Not authorized');
    }

    // Cannot deactivate self
    if (user._id.toString() === req.user._id.toString()) {
        throw new ValidationError('You cannot deactivate your own account');
    }

    user.status = status;
    await user.save();

    logger.info('User status updated', { userId: user._id, status });

    res.json({
        success: true,
        message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
        data: {
            _id: user._id,
            status: user.status
        }
    });
});

/**
 * @desc    Remove user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
const removeUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Check same organization
    if (user.organizationId.toString() !== req.user.organizationId.toString()) {
        throw new AuthorizationError('Not authorized');
    }

    // Cannot remove self
    if (user._id.toString() === req.user._id.toString()) {
        throw new ValidationError('You cannot remove yourself');
    }

    // Soft delete
    await user.softDelete(req.user._id);

    await logActivity(req.user._id, 'DELETED_USER', 'User', user._id, {
        soft: true
    }, req.user.organizationId);

    logger.info('User removed', { userId: user._id, removedBy: req.user._id });

    res.json({
        success: true,
        message: 'User removed successfully'
    });
});

/**
 * @desc    Bulk invite users
 * @route   POST /api/users/bulk-invite
 * @access  Private (Admin)
 */
const bulkInviteUsers = catchAsync(async (req, res) => {
    const { users } = req.body; // Array of { name, email, role }

    if (!Array.isArray(users) || users.length === 0) {
        throw new ValidationError('Users array is required');
    }

    if (users.length > 50) {
        throw new ValidationError('Cannot invite more than 50 users at once');
    }

    const results = {
        success: [],
        failed: []
    };

    for (const userData of users) {
        try {
            const { name, email, role } = userData;

            // Check if user exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                results.failed.push({ email, reason: 'User already exists' });
                continue;
            }

            // Create user (simplified - reuse invite logic)
            const crypto = require('crypto');
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const user = await User.create({
                name,
                email,
                role,
                organizationId: req.user.organizationId,
                status: 'pending',
                invitationToken,
                invitationExpires
            });

            results.success.push({ email, userId: user._id });
        } catch (error) {
            results.failed.push({ email: userData.email, reason: error.message });
        }
    }

    logger.info('Bulk invite completed', {
        total: users.length,
        success: results.success.length,
        failed: results.failed.length
    });

    res.json({
        success: true,
        message: `Invited ${results.success.length} users, ${results.failed.length} failed`,
        data: results
    });
});

module.exports = {
    getUsers,
    getUserById,
    inviteUser,
    updateProfile,
    updateUserRole,
    updateUserStatus,
    removeUser,
    bulkInviteUsers
};
