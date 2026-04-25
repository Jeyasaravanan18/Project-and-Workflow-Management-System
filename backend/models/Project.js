const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDelete');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'on_hold', 'archived'],
        default: 'active'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    targetEndDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Team members working on this project (auto-populated from tasks)
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Custom workflow stages for this project
    workflowStages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkflowStage'
    }]
});

// Apply soft delete plugin
projectSchema.plugin(softDeletePlugin);

// Indexes for better query performance
projectSchema.index({ organizationId: 1, status: 1 });
projectSchema.index({ managerId: 1, status: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ startDate: 1, targetEndDate: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
