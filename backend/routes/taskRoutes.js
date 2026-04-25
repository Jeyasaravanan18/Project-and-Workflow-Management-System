const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTaskStatus,
    getMyWork,
    getTaskById,
    toggleTaskTimer
} = require('../controllers/taskController');
const { protect, checkOrgAccess } = require('../middleware/authMiddleware');
const auditLogger = require('../middleware/auditMiddleware');
const Task = require('../models/Task');
const { validate } = require('../middleware/validate'); // Correct path for validate middleware
const {
    createTaskValidation,
    updateTaskStatusValidation,
    getTasksValidation
} = require('../middleware/validators/taskValidator');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management and tracking
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - projectId
 *               - moduleId
 *             properties:
 *               title:
 *                 type: string
 *               projectId:
 *                 type: string
 *               moduleId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               description:
 *                 type: string
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedHours:
 *                 type: number
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/', createTaskValidation, validate, auditLogger('CREATE_TASK', 'Task'), createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get tasks with filters
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: moduleId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', getTasksValidation, validate, getTasks);

/**
 * @swagger
 * /api/tasks/my-work:
 *   get:
 *     summary: Get tasks assigned to the current user (My Work Dashboard)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data including assigned, overdue, and completed tasks
 */
router.get('/my-work', getMyWork);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get('/:id', checkOrgAccess(Task, 'id'), getTaskById);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task stage/status
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stageId
 *             properties:
 *               stageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', checkOrgAccess(Task, 'id'), updateTaskStatusValidation, validate, auditLogger('UPDATE_TASK_STATUS', 'Task'), updateTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}/timer:
 *   post:
 *     summary: Toggle task timer
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timer toggled
 */
router.post('/:id/timer', checkOrgAccess(Task, 'id'), toggleTaskTimer);

// @desc  Get activity/audit history for a specific task
// @route GET /api/tasks/:id/activity
// @access Private
router.get('/:id/activity', async (req, res) => {
    try {
        const AuditLog = require('../models/AuditLog');
        const User = require('../models/User');
        const entries = await AuditLog.find({
            resourceId: req.params.id,
            resourceType: 'Task'
        })
            .sort({ timestamp: -1 })
            .limit(30)
            .lean();

        // Populate user names
        const userIds = [...new Set(entries.map(e => e.userId?.toString()).filter(Boolean))];
        const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u; });

        const enriched = entries.map(e => ({
            ...e,
            user: userMap[e.userId?.toString()] || { name: 'System', email: '' }
        }));

        res.json({ success: true, data: enriched });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
