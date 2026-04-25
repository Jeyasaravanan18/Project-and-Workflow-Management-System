const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { generateSprintPlan } = require('../services/aiService');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * POST /api/sprint-planner/generate
 * Body: { projectId, sprintDurationWeeks, startDate, taskIds? }
 */
const generatePlan = async (req, res) => {
    try {
        const { projectId, sprintDurationWeeks = 2, startDate, taskIds } = req.body;
        const organizationId = req.user.organizationId;

        if (!projectId) {
            return res.status(400).json({ success: false, message: 'projectId is required' });
        }

        // Fetch project
        const project = await Project.findOne({ _id: projectId, organizationId }).lean();
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Fetch tasks — either specific or all open tasks in project
        let taskQuery = { projectId, isDeleted: { $ne: true } };
        if (taskIds && taskIds.length > 0) {
            taskQuery._id = { $in: taskIds };
        } else {
            // Only include incomplete tasks for planning
            taskQuery.status = { $nin: ['done', 'completed'] };
        }

        const tasks = await Task.find(taskQuery)
            .populate('assignedTo', 'name role')
            .lean();

        if (tasks.length === 0) {
            return res.status(400).json({ success: false, message: 'No open tasks found in this project' });
        }

        // Fetch team members of this org
        const members = await User.find({ organizationId, isDeleted: { $ne: true } })
            .select('name role')
            .lean();

        // Active tasks per member
        const activeCounts = await Task.aggregate([
            { $match: { organizationId, status: { $nin: ['done', 'completed'] }, isDeleted: { $ne: true } } },
            { $unwind: '$assignedTo' },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
        ]);
        const activeMap = Object.fromEntries(activeCounts.map(a => [a._id.toString(), a.count]));

        const enrichedMembers = members.map(m => ({
            name: m.name,
            role: m.role,
            activeTasks: activeMap[m._id.toString()] || 0
        }));

        // Format tasks for AI
        const formattedTasks = tasks.map(t => ({
            title: t.title,
            priority: t.priority || 'medium',
            estimatedHours: t.estimatedHours || 0,
            status: t.status || 'todo',
            assignees: t.assignedTo?.map(u => u.name) || []
        }));

        // Call AI
        const plan = await generateSprintPlan({
            tasks: formattedTasks,
            members: enrichedMembers,
            sprintDurationWeeks,
            startDate
        });

        return res.json({
            success: true,
            data: {
                project: { id: project._id, name: project.name },
                taskCount: tasks.length,
                memberCount: members.length,
                plan
            }
        });

    } catch (error) {
        console.error('[SprintPlanner] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate sprint plan', error: error.message });
    }
};

/**
 * GET /api/sprint-planner/projects
 * Returns projects owned/accessible by the user's org
 */
const getProjects = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;
        const projects = await Project.find({ organizationId, isDeleted: { $ne: true } })
            .select('name status targetEndDate progress')
            .lean();
        return res.json({ success: true, data: projects });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { generatePlan, getProjects };
