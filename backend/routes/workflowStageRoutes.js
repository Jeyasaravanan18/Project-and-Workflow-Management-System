const express = require('express');
const router = express.Router();
const WorkflowStage = require('../models/WorkflowStage');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get workflow stages for a project
// @route   GET /api/workflow-stages?projectId=xxx
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }

        const stages = await WorkflowStage.find({ projectId }).sort('order');
        res.json(stages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
