const User = require('../models/User');
const Organization = require('../models/Organization');
const { logActivity } = require('../services/activityLogger');
const { generateTokenPair } = require('../utils/tokenManager');
const { blacklistToken } = require('../config/redis');
const logger = require('../utils/logger');
const { AuthenticationError, ValidationError, ConflictError } = require('../utils/AppError');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @desc    Register a new organization and admin user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = catchAsync(async (req, res) => {
    const { name, email, password, organizationName } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ConflictError('User with this email already exists');
    }

    // Create Organization first
    const organization = await Organization.create({
        name: organizationName
    });

    // Create Admin User
    const user = await User.create({
        name,
        email,
        password,
        organizationId: organization._id,
        role: 'admin',
        status: 'active'
    });

    // Log activity
    await logActivity(user._id, 'REGISTER_ORG', 'Organization', organization._id, {
        organizationName: organizationName
    }, organization._id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    logger.info('New organization registered', {
        userId: user._id,
        organizationId: organization._id,
        email: user.email
    });

    res.status(201).json({
        success: true,
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Authenticate a user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AuthenticationError('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked()) {
        const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
        throw new AuthenticationError(
            `Account is locked due to too many failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
        );
    }

    // Check if user has a password (pending users don't have passwords yet)
    if (!user.password) {
        logger.warn('Login attempt for user without password', {
            email,
            status: user.status,
            ip: req.ip
        });
        throw new AuthenticationError('Account setup is not complete. Please check your email for the invitation link.');
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
        // Increment failed attempts
        await user.incLoginAttempts();

        logger.warn('Failed login attempt', {
            email,
            ip: req.ip
        });

        throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
        throw new AuthenticationError('Your account is not active. Please contact support.');
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0) {
        await user.resetLoginAttempts();
    }

    // Update last active and online status
    user.lastActive = new Date();
    user.onlineStatus = 'online';
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    logger.info('User logged in', {
        userId: user._id,
        email: user.email,
        ip: req.ip
    });

    res.json({
        success: true,
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId,
                preferences: user.preferences
            },
            accessToken,
            refreshToken
        }
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = catchAsync(async (req, res) => {
    const { refreshToken: token } = req.body;

    if (!token) {
        throw new AuthenticationError('Refresh token is required');
    }

    const { verifyRefreshToken } = require('../utils/tokenManager');

    try {
        const decoded = verifyRefreshToken(token);

        // Check if user still exists
        const user = await User.findById(decoded.id);
        if (!user || user.status !== 'active') {
            throw new AuthenticationError('User no longer exists or is inactive');
        }

        // Generate new token pair
        const tokens = generateTokenPair(user._id);

        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        throw new AuthenticationError('Invalid or expired refresh token');
    }
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = catchAsync(async (req, res) => {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        // Blacklist the token
        await blacklistToken(token);
    }

    // Update user status
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            onlineStatus: 'offline',
            lastActive: new Date()
        });

        logger.info('User logged out', {
            userId: req.user._id,
            email: req.user.email
        });
    }

    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * @desc    Get user data
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = catchAsync(async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');

    res.json({
        success: true,
        data: user
    });
});

/**
 * @desc    Accept invitation and set password
 * @route   POST /api/auth/accept-invitation
 * @access  Public
 */
const acceptInvitation = catchAsync(async (req, res) => {
    const { token, password } = req.body;

    logger.info('Accept invitation request received', {
        tokenLength: token?.length,
        hasPassword: !!password
    });

    // Find user by invitation token
    const user = await User.findOne({
        invitationToken: token,
        invitationExpires: { $gt: Date.now() },
        status: 'pending'
    });

    if (!user) {
        logger.warn('Invalid or expired invitation token', { token: token?.substring(0, 10) });
        throw new ValidationError('Invalid or expired invitation link. Please contact your administrator.');
    }

    // Set password and activate account
    user.password = password;
    user.status = 'active';
    user.invitationToken = null;
    user.invitationExpires = null;
    await user.save();

    logger.info('User activated successfully', {
        userId: user._id,
        email: user.email
    });

    await logActivity(user._id, 'ACCEPTED_INVITATION', 'User', user._id, {}, user.organizationId);

    // Generate tokens for auto-login
    const tokens = generateTokenPair(user._id);

    res.json({
        success: true,
        message: 'Account activated successfully',
        data: {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                organizationId: user.organizationId
            },
            ...tokens
        }
    });
});

// @desc    Forgot Password
const forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        throw new AuthenticationError('There is no user with that email');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const frontendUrl = process.env.FRONTEND_URL || process.env.FRONTEND_URI || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. \n\nPlease make a PUT request to: \n\n${resetUrl}`;

    // HTML Message
    const htmlMessage = `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetUrl}" clicktracking=off>Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
        const sendEmail = require('../utils/sendEmail');

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message,
            html: htmlMessage
        });

        res.status(200).json({
            success: true,
            data: 'Email sent'
        });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
const resetPassword = catchAsync(async (req, res, next) => {
    const crypto = require('crypto');

    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        throw new AuthenticationError('Invalid token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log user in immediately? Or ask to login? 
    // Usually asking to login is safer/standard.

    res.status(200).json({
        success: true,
        data: 'Password updated success'
    });
});

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    acceptInvitation,
    forgotPassword,
    resetPassword
};
