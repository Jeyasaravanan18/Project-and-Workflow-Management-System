const mongoose = require('mongoose');
const softDeletePlugin = require('../plugins/softDelete');

const moduleSchema = new mongoose.Schema({
    name: {
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
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'blocked'],
        default: 'planned'
    },
    estimatedHours: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Apply soft delete plugin
moduleSchema.plugin(softDeletePlugin);

// Indexes
moduleSchema.index({ projectId: 1, status: 1 });
moduleSchema.index({ ownerId: 1 });
moduleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Module', moduleSchema);
