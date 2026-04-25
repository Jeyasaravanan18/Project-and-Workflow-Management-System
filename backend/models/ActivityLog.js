const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        // e.g., 'CREATED_TASK', 'UPDATED_STATUS', 'ASSIGNED_USER', 'LOGIN', 'FAILED_LOGIN'
    },
    actionType: {
        type: String,
        enum: ['create', 'update', 'delete', 'view', 'auth', 'security', 'system'],
        default: 'update'
    },
    entityType: {
        type: String,
        required: true,
        enum: ['User', 'Project', 'Module', 'Task', 'Organization', 'Comment', 'Attachment', 'System']
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false // Not required for auth events
    },
    // Additional context about the change
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    // Security tracking
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    isSecurityEvent: {
        type: Boolean,
        default: false
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Compound indexes for efficient queries
activityLogSchema.index({ organizationId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ entityId: 1, timestamp: -1 });
activityLogSchema.index({ organizationId: 1, isSecurityEvent: 1, timestamp: -1 });
activityLogSchema.index({ organizationId: 1, actionType: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
