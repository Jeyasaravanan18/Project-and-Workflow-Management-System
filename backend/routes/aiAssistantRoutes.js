const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    sendMessage,
    getConversations,
    getConversation,
    deleteConversation,
    getDocuments,
    uploadDocument,
    deleteDocument
} = require('../controllers/aiAssistantController');

// Chat endpoints - accessible to all authenticated users
router.post('/chat', protect, sendMessage);

// Conversation management - accessible to all authenticated users
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);

// Knowledge base - read access for all, write access for admin/manager
router.get('/documents', protect, getDocuments);
router.post('/documents', protect, authorize('admin', 'manager'), uploadDocument);
router.delete('/documents/:id', protect, authorize('admin'), deleteDocument);

module.exports = router;
