const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail } = require('../services/emailService');
const { catchAsync } = require('../middleware/errorHandler');
const { ValidationError, NotFoundError, AuthenticationError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @desc    Request password reset
 * @route   POST /api/password/forgot
 * @access  Public
 */
const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
        logger.warn('Password reset requested for non-existent email', { email });
        return res.json({
            success: true,
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
    }

    // Check if user is active
    if (user.status !== 'active') {
        logger.warn('Password reset requested for inactive user', { userId: user._id, email });
        return res.json({
            success: true,
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
    }

    // Create reset token
    const resetToken = await PasswordReset.createResetToken(user._id);

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    try {
        await sendPasswordResetEmail({
            to: user.email,
            userName: user.name,
            resetLink
        });

        logger.info('Password reset email sent', { userId: user._id, email: user.email });

        res.json({
            success: true,
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
    } catch (error) {
        logger.error('Failed to send password reset email', { error: error.message, userId: user._id });
        throw new Error('Failed to send password reset email. Please try again later.');
    }
});

/**
 * @desc    Verify reset token
 * @route   GET /api/password/verify-token/:token
 * @access  Public
 */
const verifyResetToken = catchAsync(async (req, res) => {
    const { token } = req.params;

    const resetRecord = await PasswordReset.verifyResetToken(token);

    if (!resetRecord) {
        throw new ValidationError('Invalid or expired reset token');
    }

    // Get user details
    const user = await User.findById(resetRecord.userId).select('name email');

    res.json({
        success: true,
        data: {
            valid: true,
            user: {
                name: user.name,
                email: user.email
            }
        }
    });
});

/**
 * @desc    Reset password
 * @route   POST /api/password/reset
 * @access  Public
 */
const resetPassword = catchAsync(async (req, res) => {
    const { token, password } = req.body;

    // Verify token
    const resetRecord = await PasswordReset.verifyResetToken(token);

    if (!resetRecord) {
        throw new ValidationError('Invalid or expired reset token');
    }

    // Get user
    const user = await User.findById(resetRecord.userId);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Update password
    user.password = password;
    await user.save();

    // Mark token as used
    await PasswordReset.markAsUsed(token);

    // Reset failed login attempts
    if (user.failedLoginAttempts > 0) {
        await user.resetLoginAttempts();
    }

    logger.info('Password reset successful', { userId: user._id, email: user.email });

    // Generate tokens for auto-login
    const { generateTokenPair } = require('../utils/tokenManager');
    const tokens = generateTokenPair(user._id);

    res.json({
        success: true,
        message: 'Password reset successful. You can now log in with your new password.',
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

/**
 * @desc    Change password (authenticated)
 * @route   POST /api/password/change
 * @access  Private
 */
const changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);

    if (!isPasswordValid) {
        throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info('Password changed successfully', { userId: user._id });

    res.json({
        success: true,
        message: 'Password changed successfully'
    });
});

module.exports = {
    forgotPassword,
    verifyResetToken,
    resetPassword,
    changePassword
};
