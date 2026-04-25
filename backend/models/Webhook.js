const mongoose = require('mongoose');
const crypto = require('crypto');

const webhookSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    secret: {
        type: String,
        required: true // To sign payloads
    },
    events: [{
        type: String,
        enum: ['task.created', 'task.completed', 'task.updated', 'comment.created'],
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    failureCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Webhook', webhookSchema);
