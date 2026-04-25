const Conversation = require('../models/Conversation');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const { generateAssistantResponse } = require('../services/aiService');

/**
 * @desc    Send message and get AI response
 * @route   POST /api/ai-assistant/chat
 * @access  Private (all roles)
 */
const sendMessage = async (req, res) => {
    try {
        const { message, conversationId } = req.body;
        const userId = req.user._id;
        const organizationId = req.user.organizationId;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: 'Message cannot be empty' });
        }

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                userId,
                organizationId
            });

            if (!conversation) {
                return res.status(404).json({ message: 'Conversation not found' });
            }
        } else {
            // Create new conversation
            conversation = new Conversation({
                userId,
                organizationId,
                title: 'New Conversation',
                messages: []
            });
        }

        // Add user message
        await conversation.addMessage('user', message);

        // Get conversation history for context
        const history = conversation.getHistory(10);

        // Generate AI response with RAG
        const aiResponse = await generateAssistantResponse(message, history, organizationId);

        // Add AI response to conversation
        await conversation.addMessage('assistant', aiResponse.content, aiResponse.citations, aiResponse.metadata);

        // Return response
        res.json({
            success: true,
            conversationId: conversation._id,
            message: {
                role: 'assistant',
                content: aiResponse.content,
                citations: aiResponse.citations,
                metadata: aiResponse.metadata,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('[AI Assistant] Chat error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get user's conversations
 * @route   GET /api/ai-assistant/conversations
 * @access  Private (all roles)
 */
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status = 'active', limit = 20 } = req.query;

        const conversations = await Conversation.find({
            userId,
            status
        })
            .select('title status lastMessageAt createdAt messages')
            .sort({ lastMessageAt: -1 })
            .limit(parseInt(limit));

        // Add message count and preview
        const conversationsWithPreview = conversations.map(conv => ({
            _id: conv._id,
            title: conv.title,
            status: conv.status,
            messageCount: conv.messages.length,
            lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100) || '',
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt
        }));

        res.json({
            success: true,
            conversations: conversationsWithPreview
        });

    } catch (error) {
        console.error('[AI Assistant] Get conversations error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get specific conversation with full history
 * @route   GET /api/ai-assistant/conversations/:id
 * @access  Private (all roles)
 */
const getConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversationId = req.params.id;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json({
            success: true,
            conversation
        });

    } catch (error) {
        console.error('[AI Assistant] Get conversation error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete conversation
 * @route   DELETE /api/ai-assistant/conversations/:id
 * @access  Private (all roles)
 */
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversationId = req.params.id;

        const conversation = await Conversation.findOneAndDelete({
            _id: conversationId,
            userId
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.json({
            success: true,
            message: 'Conversation deleted successfully'
        });

    } catch (error) {
        console.error('[AI Assistant] Delete conversation error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get knowledge base documents
 * @route   GET /api/ai-assistant/documents
 * @access  Private (all roles)
 */
const getDocuments = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const { type, category, limit = 50 } = req.query;

        const query = {
            organizationId,
            status: 'published'
        };

        if (type) query.type = type;
        if (category) query['metadata.category'] = category;

        const documents = await KnowledgeDocument.find(query)
            .select('title type summary tags metadata createdAt')
            .sort({ 'metadata.viewCount': -1, createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            documents
        });

    } catch (error) {
        console.error('[AI Assistant] Get documents error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Upload knowledge document
 * @route   POST /api/ai-assistant/documents
 * @access  Private (admin, manager)
 */
const uploadDocument = async (req, res) => {
    try {
        const { title, type, content, summary, tags, metadata, category } = req.body;
        const userId = req.user._id;
        const organizationId = req.user.organizationId;

        if (!title || !type || !content) {
            return res.status(400).json({ message: 'Title, type, and content are required' });
        }

        const document = new KnowledgeDocument({
            organizationId,
            title,
            type,
            content,
            summary,
            tags: tags || [],
            metadata: {
                ...metadata,
                category: category || 'general'
            },
            createdBy: userId
        });

        await document.save();

        res.status(201).json({
            success: true,
            document
        });

    } catch (error) {
        console.error('[AI Assistant] Upload document error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete knowledge document
 * @route   DELETE /api/ai-assistant/documents/:id
 * @access  Private (admin)
 */
const deleteDocument = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const documentId = req.params.id;

        const document = await KnowledgeDocument.findOneAndDelete({
            _id: documentId,
            organizationId
        });

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.json({
            success: true,
            message: 'Document deleted successfully'
        });

    } catch (error) {
        console.error('[AI Assistant] Delete document error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    getConversations,
    getConversation,
    deleteConversation,
    getDocuments,
    uploadDocument,
    deleteDocument
};
