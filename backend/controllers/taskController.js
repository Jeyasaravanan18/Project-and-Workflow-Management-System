const Task = require('../models/Task');
const WorkflowStage = require('../models/WorkflowStage');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/activityLogger');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Manager)
const createTask = async (req, res) => {
    const { title, description, projectId, moduleId, assignedTo, priority, dueDate, estimatedHours } = req.body;

    try {
        // Find initial stage (usually ordered 0)
        let initialStage = await WorkflowStage.findOne({ projectId, order: 0 });

        // If no 0 order, find 'todo' type or just the first one
        if (!initialStage) {
            initialStage = await WorkflowStage.findOne({ projectId, type: 'todo' });
        }
        if (!initialStage) {
            initialStage = await WorkflowStage.findOne({ projectId }).sort('order');
        }

        if (!initialStage) {
            res.status(400);
            throw new Error('Project has no workflow stages defined');
        }

        const task = await Task.create({
            title,
            description,
            projectId,
            moduleId,
            assignedTo, // The User ID
            currentStage: initialStage._id,
            priority,
            dueDate,
            estimatedHours,
            workflowHistory: [{
                fromStage: null, // Initial creation
                toStage: initialStage._id,
                changedBy: req.user._id
            }]
        });

        console.log('[DEBUG] Task created:', task._id);
        console.log('[DEBUG] AssignedTo:', task.assignedTo);

        await logActivity(req.user._id, 'CREATED_TASK', 'Task', task._id, { title: task.title }, req.user.organizationId);

        // Create Notifications
        if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
            console.log('[DEBUG] Creating notifications for:', assignedTo);
            const notifications = assignedTo.map(userId => ({
                userId,
                type: 'assignment',
                message: `You have been assigned to task: ${title}`,
                relatedEntity: {
                    model: 'Task',
                    id: task._id
                }
            }));
            await Notification.insertMany(notifications);
            console.log('[DEBUG] Notifications created:', notifications.length);
        } else {
            console.log('[DEBUG] No notifications created. assignedTo:', assignedTo);
        }

        // Emit socket event (if IO is available on app)
        const io = req.app.get('io');
        if (io) {
            io.emit('task:created', task);
            if (assignedTo && Array.isArray(assignedTo)) {
                assignedTo.forEach(uid => {
                    io.to(uid.toString()).emit('notification:new');
                });
            }
        }

        // Trigger automation engine
        const automationEngine = require('../services/automationEngine');
        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name')
            .lean();
        automationEngine.emit('task.created', {
            task: populatedTask,
            user: req.user,
            organizationId: req.user.organizationId
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    const { projectId, moduleId, assignedTo } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (moduleId) filter.moduleId = moduleId;
    if (assignedTo) filter.assignedTo = assignedTo;

    // If member, maybe restrict? Requirement says "Tasks currently assigned", implies visibility of own tasks.
    // But also "Which users are working on a specific software project" for managers.
    // So read access is likely broad, modification is strict.

    try {
        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email')
            .populate('currentStage')
            .populate('moduleId', 'name')
            .sort({ updatedAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private (Assigned User or Manager)
const updateTaskStatus = async (req, res) => {
    const { stageId } = req.body; // New Stage ID

    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        // Authorization: Assigned User OR Manager OR Admin
        // For now assuming role check on user object
        const isAssigned = task.assignedTo.some(id => id.toString() === req.user._id.toString());
        const isManager = req.user.role === 'manager' || req.user.role === 'admin';

        if (!isAssigned && !isManager) {
            res.status(403);
            throw new Error('Not authorized to update this task');
        }

        const oldStageId = task.currentStage;
        const newStage = await WorkflowStage.findById(stageId);

        if (!newStage) {
            res.status(400);
            throw new Error('Invalid stage ID');
        }

        // Verify stage belongs to same project
        if (newStage.projectId.toString() !== task.projectId.toString()) {
            res.status(400);
            throw new Error('Stage does not belong to this project');
        }

        task.currentStage = stageId;
        task.workflowHistory.push({
            fromStage: oldStageId,
            toStage: stageId,
            changedBy: req.user._id
        });

        if (newStage.isCompleteStage) {
            task.completedAt = Date.now();
        } else {
            task.completedAt = undefined; // If moved back
        }

        // Update timestamp
        task.updatedAt = Date.now();

        await task.save();

        await logActivity(req.user._id, 'UPDATED_TASK_STATUS', 'Task', task._id, {
            oldStage: oldStageId,
            newStage: stageId
        }, req.user.organizationId);

        const io = req.app.get('io');
        if (io) {
            io.emit('task:updated', { taskId: task._id, newStageId: stageId });
        }

        // Trigger automation engine
        const automationEngine = require('../services/automationEngine');
        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('projectId', 'name')
            .populate('currentStage')
            .lean();
        automationEngine.emit('task.status_changed', {
            task: populatedTask,
            user: req.user,
            organizationId: req.user.organizationId,
            oldStageId,
            newStageId: stageId
        });
        automationEngine.emit('task.updated', {
            task: populatedTask,
            user: req.user,
            organizationId: req.user.organizationId
        });

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get My Work Dashboard
// @route   GET /api/tasks/my-work
// @access  Private
const getMyWork = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Tasks assigned to me
        console.log('[DEBUG] Fetching tasks for user:', userId);
        const assignedTasks = await Task.find({
            assignedTo: userId, // MongoDB automatically checks if userId is in the array
            completedAt: { $exists: false }
        })
            .populate('assignedTo', 'name email')
            .populate('currentStage')
            .populate('projectId', 'name')
            .populate('moduleId', 'name')
            .sort({ priority: -1, dueDate: 1 }); // High priority, soonest due first

        console.log('[DEBUG] Found tasks:', assignedTasks.length);

        // 2. Completed Today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const completedToday = await Task.countDocuments({
            assignedTo: userId,
            completedAt: { $gte: startOfDay }
        });

        // 3. Pending/Overdue
        const overdueTasks = assignedTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

        // 4. Activity Heatmap Data (Last 365 Days)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const activityStats = await Task.aggregate([
            {
                $match: {
                    assignedTo: userId,
                    completedAt: { $gte: oneYearAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    date: "$_id",
                    count: 1,
                    level: {
                        $min: [4, "$count"] // Max level 4
                    },
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);

        // 5. Completed Tasks (for "Completed Works" section)
        const completedTasks = await Task.find({
            assignedTo: userId,
            completedAt: { $exists: true }
        })
            .populate('assignedTo', 'name email')
            .populate('currentStage')
            .populate('projectId', 'name')
            .populate('moduleId', 'name')
            .sort({ completedAt: -1 }) // Most recently completed first
            .limit(50); // Limit to last 50 completed tasks

        res.json({
            assignedTasks,
            completedToday,
            overdueCount: overdueTasks.length,
            overdueTasks: overdueTasks.map(t => ({ id: t._id, title: t.title, dueDate: t.dueDate })),
            activityData: activityStats,
            completedTasks // NEW: for completed works section
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email avatar')
            .populate('currentStage')
            .populate('projectId', 'name')
            .populate('moduleId', 'name')
            .populate('workflowHistory.changedBy', 'name')
            .populate('workflowHistory.fromStage')
            .populate('workflowHistory.toStage');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle task timer (Start/Stop)
// @route   POST /api/tasks/:id/timer
// @access  Private (Assigned User)
const toggleTaskTimer = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Only assigned users can track time
        const isAssigned = task.assignedTo.some(id => id.toString() === req.user._id.toString());
        if (!isAssigned) {
            return res.status(403).json({ message: 'You must be assigned to this task to track time' });
        }

        if (task.timerStartedAt) {
            // STOP Timer
            const now = new Date();
            const elapsedSeconds = Math.floor((now - new Date(task.timerStartedAt)) / 1000);

            task.timeSpent = (task.timeSpent || 0) + elapsedSeconds;
            task.timerStartedAt = null;
            task.timerStartedBy = null;

            await logActivity(req.user._id, 'STOPPED_TIMER', 'Task', task._id, {
                timeSpent: elapsedSeconds,
                totalTime: task.timeSpent
            }, req.user.organizationId);
        } else {
            // START Timer
            // Optional: Stop other running timers for this user? (Complexity decision: Keep simple for now)
            task.timerStartedAt = new Date();
            task.timerStartedBy = req.user._id;

            await logActivity(req.user._id, 'STARTED_TIMER', 'Task', task._id, {}, req.user.organizationId);
        }

        await task.save();

        // Real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('task:updated', {
                taskId: task._id,
                timerStartedAt: task.timerStartedAt,
                timeSpent: task.timeSpent
            });
        }

        res.json({
            success: true,
            timerStartedAt: task.timerStartedAt,
            timeSpent: task.timeSpent,
            isRunning: !!task.timerStartedAt
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTask,
    getTasks,
    updateTaskStatus,
    getMyWork,
    getTaskById,
    toggleTaskTimer
};


