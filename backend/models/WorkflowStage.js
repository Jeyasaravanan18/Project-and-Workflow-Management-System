const mongoose = require('mongoose');

const workflowStageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    // If true, tasks in this stage are considered "completed" (e.g. for completion %)
    isCompleteStage: {
        type: Boolean,
        default: false
    }
});

// compound index to ensure stage names are unique per project
workflowStageSchema.index({ projectId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('WorkflowStage', workflowStageSchema);
