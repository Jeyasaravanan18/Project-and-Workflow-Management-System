const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 5000
    },
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    attachments: [{
        filename: String,
        url: String,
        size: Number,
        mimeType: String
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date
}, {
    timestamps: true
});

// Indexes
commentSchema.index({ taskId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
