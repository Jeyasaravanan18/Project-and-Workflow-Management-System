const express = require('express');
const router = express.Router();
const {
    getRecentActivities,
    getAuditTrail,
    exportAuditTrail,
    getActivityStats,
    getActivities
} = require('../controllers/activityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Recent activities for dashboard feed (Admin/Manager)
router.get('/recent', protect, authorize('admin', 'manager'), getRecentActivities);

// Advanced audit trail (Admin only)
router.get('/audit', protect, authorize('admin'), getAuditTrail);

// Export audit trail (Admin only)
router.post('/export', protect, authorize('admin'), exportAuditTrail);

// Activity statistics (Admin/Manager)
router.get('/stats', protect, authorize('admin', 'manager'), getActivityStats);

// Legacy endpoint for backward compatibility
router.get('/', protect, getActivities);

module.exports = router;
