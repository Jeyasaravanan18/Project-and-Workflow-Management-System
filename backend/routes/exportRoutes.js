const express = require('express');
const router = express.Router();
const { exportTasks, exportAnalytics } = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// GET /api/export/tasks?format=csv|xlsx&projectId=&status=&priority=
router.get('/tasks', exportTasks);

// GET /api/export/analytics?format=csv|xlsx
router.get('/analytics', authorize('admin', 'manager'), exportAnalytics);

module.exports = router;
