const express = require('express');
const router = express.Router();
const { generatePlan, getProjects } = require('../controllers/sprintPlannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/sprint-planner/projects — fetch available projects for the org
router.get('/projects', protect, authorize('admin', 'manager'), getProjects);

// POST /api/sprint-planner/generate — generate AI sprint plan
router.post('/generate', protect, authorize('admin', 'manager'), generatePlan);

module.exports = router;
