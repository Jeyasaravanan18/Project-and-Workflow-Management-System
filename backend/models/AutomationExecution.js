const mongoose = require('mongoose');

const automationExecutionSchema = new mongoose.Schema({
    automationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Automation',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Execution details
    triggeredAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    triggeredBy: {
        type: String,
        enum: ['schedule', 'event', 'webhook', 'manual'],
        required: true
    },
    triggerData: {
        type: mongoose.Schema.Types.Mixed
    },

    // Execution results
    status: {
        type: String,
        enum: ['running', 'completed', 'failed', 'partial'],
        default: 'running'
    },
    steps: [{
        stepNumber: Number,
        actionType: String,
        status: {
            type: String,
            enum: ['pending', 'running', 'completed', 'failed']
        },
        startedAt: Date,
        completedAt: Date,
        result: mongoose.Schema.Types.Mixed,
        error: String
    }],

    // Performance
    duration: {
        type: Number, // milliseconds
        default: 0
    },

    // Error details
    error: {
        message: String,
        stack: String
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
automationExecutionSchema.index({ automationId: 1, triggeredAt: -1 });
automationExecutionSchema.index({ organizationId: 1, status: 1, triggeredAt: -1 });

module.exports = mongoose.model('AutomationExecution', automationExecutionSchema);
