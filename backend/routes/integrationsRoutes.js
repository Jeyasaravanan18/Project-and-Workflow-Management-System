const express = require('express');
const router = express.Router();
const {
    getIntegrationCatalog,
    getConnectedIntegrations,
    connectIntegration,
    testIntegration,
    disconnectIntegration
} = require('../controllers/integrationsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require admin access
router.use(protect, authorize('admin'));

router.get('/catalog', getIntegrationCatalog);
router.get('/connected', getConnectedIntegrations);
router.post('/:service/connect', connectIntegration);
router.post('/:service/test', testIntegration);
router.delete('/:service', disconnectIntegration);

module.exports = router;
