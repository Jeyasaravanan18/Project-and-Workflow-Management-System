const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    resourceType: {
        type: String,
        required: true,
        index: true
    },
    resourceId: {
        type: String,
        required: true
    },
    changes: {
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Optimization for large scale: Indexing by timestamp for date-range queries
auditLogSchema.index({ organizationId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
