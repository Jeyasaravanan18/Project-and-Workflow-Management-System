const express = require('express');
const router = express.Router();
const { getWebhooks, createWebhook, deleteWebhook } = require('../controllers/webhookController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getWebhooks);
router.post('/', createWebhook);
router.delete('/:id', deleteWebhook);

module.exports = router;
