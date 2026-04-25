const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'New Conversation'
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        citations: [{
            documentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'KnowledgeDocument'
            },
            title: String,
            relevanceScore: Number,
            excerpt: String
        }],
        metadata: {
            model: String,
            tokens: Number,
            responseTime: Number // in milliseconds
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'resolved', 'archived'],
        default: 'active',
        index: true
    },
    category: {
        type: String,
        enum: ['workflow', 'technical', 'process', 'user_management', 'analytics', 'automation', 'general'],
        default: 'general'
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    feedback: String,
    lastMessageAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
conversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ organizationId: 1, createdAt: -1 });

// Auto-generate title from first user message
conversationSchema.methods.generateTitle = function () {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        // Take first 50 chars of first message as title
        this.title = firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
    }
    return this.save();
};

// Add a message to conversation
conversationSchema.methods.addMessage = function (role, content, citations = [], metadata = {}) {
    this.messages.push({
        role,
        content,
        citations,
        metadata,
        timestamp: new Date()
    });
    this.lastMessageAt = new Date();

    // Auto-generate title from first user message
    if (this.messages.length === 1 && role === 'user' && this.title === 'New Conversation') {
        this.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    return this.save();
};

// Get conversation history for AI context (last N messages)
conversationSchema.methods.getHistory = function (limit = 10) {
    return this.messages
        .slice(-limit)
        .map(m => ({
            role: m.role,
            content: m.content
        }));
};

module.exports = mongoose.model('Conversation', conversationSchema);
