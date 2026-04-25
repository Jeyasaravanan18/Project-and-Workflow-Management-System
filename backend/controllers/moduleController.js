const Module = require('../models/Module');
const Task = require('../models/Task');
const WorkflowStage = require('../models/WorkflowStage');
const Notification = require('../models/Notification');
const { logActivity } = require('../services/activityLogger');

// @desc    Create a new module
// @route   POST /api/modules
// @access  Private (Manager)
const createModule = async (req, res) => {
    const { name, description, projectId, ownerId, estimatedHours } = req.body;

    try {
        const module = await Module.create({
            name,
            description,
            projectId,
            ownerId,
            estimatedHours
        });

        await logActivity(req.user._id, 'CREATED_MODULE', 'Module', module._id, { name: module.name }, req.user.organizationId);

        // Notify Owner
        if (ownerId && ownerId.toString() !== req.user._id.toString()) {
            await Notification.create({
                userId: ownerId,
                type: 'assignment',
                message: `You have been assigned as owner of module: ${name}`,
                relatedEntity: { model: 'Module', id: module._id }
            });
            const io = req.app.get('io');
            if (io) {
                // Try emit to user room
                io.to(ownerId.toString()).emit('notification:new');
            }
        }
        res.status(201).json(module);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all modules for a project
// @route   GET /api/modules
// @access  Private
const getModules = async (req, res) => {
    const { projectId } = req.query;

    try {
        if (!projectId) {
            res.status(400);
            throw new Error('Project ID is required');
        }

        const modules = await Module.find({ projectId }).populate('ownerId', 'name email');
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get module analytics
// @route   GET /api/modules/:id/analytics
// @access  Private
const getModuleAnalytics = async (req, res) => {
    try {
        const moduleId = req.params.id;
        const tasks = await Task.find({ moduleId }).populate('currentStage');

        if (!tasks) {
            return res.json({ message: "No tasks found" });
        }

        const totalTasks = tasks.length;
        const completedCount = tasks.filter(t => t.currentStage && t.currentStage.isCompleteStage).length;

        // Status breakdown
        const statusDistribution = tasks.reduce((acc, task) => {
            const stageName = task.currentStage ? task.currentStage.name : 'Unknown';
            acc[stageName] = (acc[stageName] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalTasks,
            completedCount,
            completionPercentage: totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100),
            statusDistribution
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get module details with all tasks
// @route   GET /api/modules/:id
// @access  Private
const getModuleDetails = async (req, res) => {
    try {
        const module = await Module.findById(req.params.id)
            .populate('ownerId', 'name email')
            .populate('projectId', 'name workflowStages');

        if (!module) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // Get all tasks for this module
        const tasks = await Task.find({ moduleId: req.params.id })
            .populate('assignedTo', 'name email')
            .populate('currentStage')
            .sort({ createdAt: -1 });

        // Get team members (unique users assigned to tasks in this module)
        const allAssignees = tasks.flatMap(t => t.assignedTo || []);
        const teamMemberIds = [...new Set(allAssignees.map(u => u._id.toString()))];

        // Calculate stats
        const completedTasks = tasks.filter(t =>
            t.currentStage && t.currentStage.isCompleteStage).length;
        const completionPercentage = tasks.length === 0 ? 0 :
            Math.round((completedTasks / tasks.length) * 100);

        res.json({
            module,
            tasks,
            teamMemberIds,
            stats: {
                totalTasks: tasks.length,
                completedTasks,
                completionPercentage
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createModule,
    getModules,
    getModuleAnalytics,
    getModuleDetails
};
