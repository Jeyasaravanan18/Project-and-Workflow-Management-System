const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const softDeletePlugin = require('../plugins/softDelete');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () {
            // Password not required on creation if user is being invited
            return this.status === 'active';
        }
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'member'],
        default: 'member'
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active'],
        default: 'active'
    },
    invitationToken: {
        type: String,
        default: null
    },
    invitationExpires: {
        type: Date,
        default: null
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    onlineStatus: {
        type: String,
        enum: ['online', 'away', 'offline'],
        default: 'offline'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'light'
        },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            inApp: { type: Boolean, default: true }
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: 500,
        default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
    // Skip if password is not modified or doesn't exist
    if (!this.isModified('password') || !this.password) {
        next();
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function () {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 15 * 60 * 1000; // 15 minutes

    // Lock account after max attempts
    if (this.failedLoginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }

    return this.updateOne(updates);
};

// Reset failed login attempts
userSchema.methods.resetLoginAttempts = async function () {
    return this.updateOne({
        $set: { failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

// Apply soft delete plugin
userSchema.plugin(softDeletePlugin);

// Indexes for better query performance
// Note: email index is created with partialFilterExpression to allow soft deletes
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, status: 1 });
userSchema.index({ onlineStatus: 1, lastActive: -1 });
userSchema.index({ invitationToken: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
