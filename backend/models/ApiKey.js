const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    key: {
        type: String, // Hashed
        required: true,
        unique: true
    },
    prefix: {
        type: String, // To show partial key
        required: true
    },
    scopes: [{
        type: String,
        enum: ['read', 'write', 'admin'],
        default: 'read'
    }],
    lastUsed: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Calculate hash of key
apiKeySchema.statics.hashKey = function (key) {
    return crypto.createHash('sha256').update(key).digest('hex');
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
