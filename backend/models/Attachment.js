const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relatedEntity: {
        model: {
            type: String,
            enum: ['Task', 'Project', 'Comment'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    }
}, {
    timestamps: true
});

attachmentSchema.index({ 'relatedEntity.id': 1, 'relatedEntity.model': 1 });
attachmentSchema.index({ uploader: 1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
