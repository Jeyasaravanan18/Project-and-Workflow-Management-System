const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
// Note: token index is already created via 'unique: true' in schema definition
passwordResetSchema.index({ userId: 1, createdAt: -1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to create reset token
passwordResetSchema.statics.createResetToken = async function (userId) {
    // Invalidate any existing tokens for this user
    await this.updateMany(
        { userId, used: false },
        { $set: { used: true } }
    );

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Create new reset record
    await this.create({
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    return resetToken; // Return unhashed token to send in email
};

// Static method to verify reset token
passwordResetSchema.statics.verifyResetToken = async function (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.findOne({
        token: hashedToken,
        used: false,
        expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
        return null;
    }

    return resetRecord;
};

// Static method to mark token as used
passwordResetSchema.statics.markAsUsed = async function (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this.updateOne(
        { token: hashedToken },
        { $set: { used: true } }
    );
};

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
