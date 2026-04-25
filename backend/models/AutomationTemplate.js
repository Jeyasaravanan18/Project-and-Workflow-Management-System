const mongoose = require('mongoose');

const automationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['task_management', 'project_management', 'notifications', 'reporting', 'onboarding', 'integrations'],
        required: true
    },
    icon: {
        type: String,
        default: 'zap'
    },

    // Template configuration
    template: {
        trigger: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        conditions: [{
            type: mongoose.Schema.Types.Mixed
        }],
        actions: [{
            type: mongoose.Schema.Types.Mixed,
            required: true
        }]
    },

    // Customization fields
    customizableFields: [{
        path: String, // e.g., "actions[0].config.assignee"
        label: String,
        type: {
            type: String,
            enum: ['text', 'user_select', 'project_select', 'status_select', 'priority_select', 'number', 'date']
        },
        required: Boolean,
        defaultValue: mongoose.Schema.Types.Mixed
    }],

    // Metadata
    usageCount: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
automationTemplateSchema.index({ category: 1, featured: -1 });

module.exports = mongoose.model('AutomationTemplate', automationTemplateSchema);
