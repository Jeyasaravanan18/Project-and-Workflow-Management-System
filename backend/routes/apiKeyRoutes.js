const express = require('express');
const router = express.Router();
const { getApiKeys, createApiKey, revokeApiKey } = require('../controllers/apiKeyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getApiKeys);
router.post('/', createApiKey);
router.delete('/:id', revokeApiKey);

module.exports = router;
