const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAutomations,
    getAutomation,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    testAutomation,
    getExecutions,
    getTemplates,
    createFromTemplate
} = require('../controllers/automationController');

// All routes require authentication
router.use(protect);

// Templates (accessible to all authenticated users)
router.get('/templates', getTemplates);
router.post('/from-template/:id', authorize('admin', 'manager'), createFromTemplate);

// Automation CRUD (admin and manager only)
router.get('/', authorize('admin', 'manager'), getAutomations);
router.post('/', authorize('admin', 'manager'), createAutomation);
router.get('/:id', authorize('admin', 'manager'), getAutomation);
router.put('/:id', authorize('admin', 'manager'), updateAutomation);
router.delete('/:id', authorize('admin', 'manager'), deleteAutomation);

// Automation actions
router.post('/:id/toggle', authorize('admin', 'manager'), toggleAutomation);
router.post('/:id/test', authorize('admin', 'manager'), testAutomation);
router.get('/:id/executions', authorize('admin', 'manager'), getExecutions);

module.exports = router;
