const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Trigger configuration
    trigger: {
        type: {
            type: String,
            enum: ['event', 'schedule', 'webhook'],
            required: true
        },
        config: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        }
    },

    // Conditions (optional)
    conditions: [{
        field: String,
        operator: {
            type: String,
            enum: ['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in']
        },
        value: mongoose.Schema.Types.Mixed,
        logicOperator: {
            type: String,
            enum: ['AND', 'OR'],
            default: 'AND'
        }
    }],

    // Actions to execute
    actions: [{
        type: {
            type: String,
            required: true,
            enum: [
                'send_notification',
                'create_task',
                'update_task',
                'assign_task',
                'send_email',
                'create_comment',
                'update_project',
                'delay',
                'send_webhook',
                'slack_notification'
            ]
        },
        config: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        order: {
            type: Number,
            default: 0
        }
    }],

    // Execution settings
    enabled: {
        type: Boolean,
        default: true
    },
    runCount: {
        type: Number,
        default: 0
    },
    lastRun: {
        type: Date
    },
    lastRunStatus: {
        type: String,
        enum: ['success', 'failed', 'partial']
    },

    // Metadata
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes
automationSchema.index({ organizationId: 1, enabled: 1 });
automationSchema.index({ 'trigger.type': 1 });
automationSchema.index({ createdBy: 1 });

// Update timestamp on save
automationSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Automation', automationSchema);
