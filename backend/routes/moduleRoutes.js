const express = require('express');
const router = express.Router();
const {
    createModule,
    getModules,
    getModuleAnalytics,
    getModuleDetails
} = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getModules) // ?projectId=...
    .post(protect, authorize('manager', 'admin'), createModule);

router.get('/:id', protect, getModuleDetails);
router.get('/:id/analytics', protect, getModuleAnalytics);

module.exports = router;
