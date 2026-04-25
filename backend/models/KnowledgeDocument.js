const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['runbook', 'incident_report', 'guide', 'faq', 'troubleshooting', 'best_practice'],
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        maxlength: 500
    },
    tags: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    metadata: {
        severity: {
            type: String,
            enum: ['critical', 'high', 'medium', 'low'],
            default: 'medium'
        },
        category: {
            type: String,
            enum: ['workflow', 'technical', 'process', 'user_management', 'analytics', 'automation', 'general'],
            default: 'general'
        },
        lastIncidentDate: Date,
        resolutionTime: Number, // in minutes
        successRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 100
        },
        viewCount: {
            type: Number,
            default: 0
        },
        helpfulCount: {
            type: Number,
            default: 0
        }
    },
    // For future vector search implementation
    chunks: [{
        text: String,
        chunkIndex: Number,
        // embedding: [Number] // For vector search (future)
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for efficient search
knowledgeDocumentSchema.index({ title: 'text', content: 'text', tags: 'text' });
knowledgeDocumentSchema.index({ organizationId: 1, type: 1 });
knowledgeDocumentSchema.index({ organizationId: 1, 'metadata.category': 1 });
knowledgeDocumentSchema.index({ status: 1, createdAt: -1 });

// Method to increment view count
knowledgeDocumentSchema.methods.incrementView = function () {
    this.metadata.viewCount += 1;
    return this.save();
};

// Method to mark as helpful
knowledgeDocumentSchema.methods.markHelpful = function () {
    this.metadata.helpfulCount += 1;
    return this.save();
};

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
