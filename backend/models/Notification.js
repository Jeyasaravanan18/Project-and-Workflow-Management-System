const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['assignment', 'status_change', 'deadline_approaching', 'overdue', 'mention', 'system'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedEntity: {
        model: {
            type: String,
            enum: ['Task', 'Project', 'Module']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// TTL index - automatically delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
