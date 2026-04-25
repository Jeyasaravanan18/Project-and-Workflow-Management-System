const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDelete');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    // Workflow stage ID (e.g., To Do, In Progress, Review, Done)
    currentStage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkflowStage',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    dueDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    // Time Tracking
    timeSpent: {
        type: Number, // Total seconds spent
        default: 0
    },
    timerStartedAt: {
        type: Date, // If null, timer is stopped
        default: null
    },
    timerStartedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // History of all stage transitions for analytics
    workflowHistory: [{
        fromStage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkflowStage'
        },
        toStage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkflowStage'
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

// Index for efficient querying by assignee and stage (for My Work dashboards)
taskSchema.index({ assignedTo: 1, currentStage: 1 });
taskSchema.index({ projectId: 1, currentStage: 1 });
taskSchema.index({ projectId: 1, moduleId: 1 });
taskSchema.index({ dueDate: 1, completedAt: 1 });
taskSchema.index({ priority: 1, currentStage: 1 });
taskSchema.index({ assignedTo: 1, completedAt: 1 });
// Optimization for Kanban board filtering
taskSchema.index({ projectId: 1, currentStage: 1, priority: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ updatedAt: -1 });

// Apply soft delete plugin
taskSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Task', taskSchema);
