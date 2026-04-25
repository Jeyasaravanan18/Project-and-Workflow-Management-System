const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Module = require('../models/Module');
const WorkflowStage = require('../models/WorkflowStage');
const { logActivity } = require('../services/activityLogger');
const { catchAsync } = require('../middleware/errorHandler');
const { parsePaginationParams, applyPagination } = require('../utils/pagination');
const { NotFoundError, AuthorizationError } = require('../utils/AppError');
const logger = require('../utils/logger');
const automationEngine = require('../services/automationEngine');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Manager/Admin)
const createProject = catchAsync(async (req, res) => {
    const { name, description, managerId, targetEndDate, workflowStages } = req.body;

    // Validate required fields
    if (!name) {
        logger.error('Project creation failed: name is required');
        return res.status(400).json({
            success: false,
            message: 'Project name is required'
        });
    }

    if (!targetEndDate) {
        logger.error('Project creation failed: targetEndDate is required');
        return res.status(400).json({
            success: false,
            message: 'Target end date is required'
        });
    }

    // Validate user has organizationId
    if (!req.user.organizationId) {
        logger.error('Project creation failed: user has no organizationId', {
            userId: req.user._id,
            userEmail: req.user.email
        });
        return res.status(400).json({
            success: false,
            message: 'User is not associated with an organization'
        });
    }

    logger.info('Creating project', {
        name,
        organizationId: req.user.organizationId,
        userId: req.user._id
    });

    const project = await Project.create({
        name,
        description,
        organizationId: req.user.organizationId,
        managerId: managerId || req.user._id,
        targetEndDate
    });

    // Create default workflow stages if none provided
    const stagesToCreate = workflowStages || [
        { name: 'Backlog', type: 'backlog', order: 0 },
        { name: 'To Do', type: 'todo', order: 1 },
        { name: 'In Progress', type: 'in_progress', order: 2 },
        { name: 'Review', type: 'review', order: 3 },
        { name: 'Done', type: 'done', order: 4, isCompleteStage: true }
    ];

    const createdStages = await WorkflowStage.insertMany(
        stagesToCreate.map(stage => ({ ...stage, projectId: project._id }))
    );

    project.workflowStages = createdStages.map(s => s._id);
    await project.save();

    await logActivity(req.user._id, 'CREATED_PROJECT', 'Project', project._id, { name: project.name }, req.user.organizationId);

    logger.info('Project created', { projectId: project._id, name: project.name, userId: req.user._id });

    res.status(201).json({
        success: true,
        data: project
    });
});

// @desc    Get all projects for organization
// @route   GET /api/projects
// @access  Private
const getProjects = catchAsync(async (req, res) => {
    const { page, limit, skip, sort } = parsePaginationParams(req.query);
    const { status, managerId } = req.query;

    // Build filter
    const filter = { organizationId: req.user.organizationId };
    if (status) filter.status = status;
    if (managerId) filter.managerId = managerId;

    // Get paginated projects
    const query = Project.find(filter)
        .populate('managerId', 'name email')
        .select('-__v')
        .lean();

    const result = await applyPagination(query, Project, page, limit, skip, sort);
    const projects = result.data;
    const projectIds = projects.map(p => p._id);

    // Aggregate task stats
    const taskStats = await Task.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
            $group: {
                _id: '$projectId',
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $gt: ['$completedAt', null] }, 1, 0] } }
            }
        }
    ]);

    // Map stats to projects
    const statsMap = {};
    taskStats.forEach(stat => {
        statsMap[stat._id.toString()] = stat;
    });

    const projectsWithProgress = projects.map(project => {
        const stats = statsMap[project._id.toString()] || { total: 0, completed: 0 };
        const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
        return { ...project, progress, taskStats: stats };
    });

    res.json({
        success: true,
        data: projectsWithProgress,
        pagination: result.pagination
    });
});

// @desc    Get project details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('managerId', 'name email')
            .populate('workflowStages');

        if (!project) {
            res.status(404);
            throw new Error('Project not found');
        }

        // Check access
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            res.status(403);
            throw new Error('Not authorized');
        }

        res.json(project);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

// @desc    Get project dashboard analytics (Auto-calculated)
// @route   GET /api/projects/:id/dashboard
// @access  Private
const getProjectDashboard = async (req, res) => {
    try {
        const projectId = req.params.id;

        // 1. Task Status Distribution
        // Aggregate tasks by currentStage
        const tasksByStage = await Task.aggregate([
            { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
            { $group: { _id: '$currentStage', count: { $sum: 1 } } }
        ]);

        // Populate stage names
        const populatedTasksByStage = await WorkflowStage.populate(tasksByStage, { path: '_id', select: 'name type' });

        // 2. Module Completion Status
        // Calculate completion % for each module based on its tasks
        const modules = await Module.find({ projectId }).select('name status estimatedHours');
        const moduleStats = await Promise.all(modules.map(async (mod) => {
            const moduleTasks = await Task.find({ moduleId: mod._id }).populate('currentStage');
            const totalTasks = moduleTasks.length;
            const completedTasks = moduleTasks.filter(t => t.currentStage.isCompleteStage).length;
            const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

            return {
                ...mod.toObject(),
                completionPercentage,
                totalTasks,
                completedTasks
            };
        }));

        // 3. Risks & Delays (Auto-detected)
        const delayedTasks = await Task.find({
            projectId,
            dueDate: { $lt: new Date() },
            completedAt: { $exists: false } // Not completed
        }).populate('assignedTo', 'name').limit(5);

        res.json({
            tasksByStage: populatedTasksByStage.map(item => ({ stage: item._id, count: item.count })),
            moduleStats,
            delayedTasks,
            projectSummary: {
                totalModules: modules.length,
                totalTasks: await Task.countDocuments({ projectId }),
                // Calculate overall project completion could be added here
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get project team members with online status
// @route   GET /api/projects/:id/team
// @access  Private
const getProjectTeamMembers = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('managerId', 'name email role onlineStatus lastActive');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get all tasks for this project to find team members
        const Task = require('../models/Task');
        const tasks = await Task.find({ projectId: req.params.id })
            .select('assignedTo')
            .populate('assignedTo', 'name email role onlineStatus lastActive');

        // Collect unique team members from tasks
        const teamMemberMap = new Map();

        // Add project manager
        if (project.managerId) {
            teamMemberMap.set(project.managerId._id.toString(), project.managerId);
        }

        // Add team members from tasks
        tasks.forEach(task => {
            if (task.assignedTo) {
                const userId = task.assignedTo._id.toString();
                if (!teamMemberMap.has(userId)) {
                    teamMemberMap.set(userId, task.assignedTo);
                }
            }
        });

        // Convert to array and separate by role
        const allMembers = Array.from(teamMemberMap.values());
        // Exclude admins from the list
        const managers = allMembers.filter(u => u.role === 'manager');
        const members = allMembers.filter(u => u.role === 'member');

        res.json({
            managers,
            members,
            totalCount: allMembers.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get project team members
// @route   GET /api/projects/:id/members
// @access  Private
const getProjectMembers = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('teamMembers', 'name email role onlineStatus lastActive')
            .populate('managerId', 'name email role onlineStatus lastActive');

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get task counts for each member
        const membersWithStats = await Promise.all(
            project.teamMembers
                .filter(member => member.role !== 'admin')
                .map(async (member) => {
                    const tasksAssigned = await Task.countDocuments({
                        projectId: req.params.id,
                        assignedTo: member._id
                    });

                    const tasksCompleted = await Task.countDocuments({
                        projectId: req.params.id,
                        assignedTo: member._id,
                        isCompleted: true
                    });

                    return {
                        ...member.toObject(),
                        tasksAssigned,
                        tasksCompleted
                    };
                })
        );

        // Include project manager
        const manager = {
            ...project.managerId.toObject(),
            isManager: true
        };

        res.json({
            manager,
            members: membersWithStats,
            totalCount: membersWithStats.length + 1
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private (Admin/Manager)
const addProjectMember = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check if user exists and is in same organization
        const User = require('../models/User');
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'User not in same organization' });
        }

        // Check if already a member or manager
        const isManager = project.managerId.toString() === userId.toString();
        const isMember = project.teamMembers.some(id => id.toString() === userId.toString());

        if (isManager || isMember) {
            return res.status(400).json({ message: 'User is already a team member or manager' });
        }

        // Add to team
        project.teamMembers.push(userId);
        await project.save();

        // Log activity
        await logActivity(req.user._id, 'ADDED_PROJECT_MEMBER', {
            entityType: 'Project',
            entityId: project._id,
            metadata: { userId }
        }, {}, req.user.organizationId);

        res.json({ message: 'Member added successfully', project });
    } catch (error) {
        console.error('Error adding project member:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (Admin/Manager)
const removeProjectMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Cannot remove project manager
        if (project.managerId.toString() === req.params.userId) {
            return res.status(400).json({ message: 'Cannot remove project manager' });
        }

        // Remove from team
        project.teamMembers = project.teamMembers.filter(
            memberId => memberId.toString() !== req.params.userId
        );

        await project.save();

        // Log activity
        await logActivity(req.user._id, 'REMOVED_PROJECT_MEMBER', {
            entityType: 'Project',
            entityId: project._id,
            metadata: { userId: req.params.userId }
        }, {}, req.user.organizationId);

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Scaffold project with AI (Creates modules and tasks)
// @route   POST /api/projects/:id/scaffold
// @access  Private (Admin)
const scaffoldProject = async (req, res) => {
    try {
        const { description } = req.body;
        const projectId = req.params.id;

        if (!description) {
            return res.status(400).json({ message: 'Project description is required' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check access (only Admins should ideally scaffold, or Managers of the project)
        if (project.organizationId.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // 1. Get initial workflow stage for new tasks (e.g. "To Do" or "Backlog")
        let initialStage = await WorkflowStage.findOne({ projectId, order: 0 });
        if (!initialStage) {
            initialStage = await WorkflowStage.findOne({ projectId, type: 'todo' });
        }
        if (!initialStage) {
            initialStage = await WorkflowStage.findOne({ projectId }).sort('order');
        }

        if (!initialStage) {
            return res.status(400).json({ message: 'Project has no workflow stages defined. Cannot create tasks.' });
        }

        // 2. Call AI Service to generate structure
        const { generateProjectStructure } = require('../services/aiService');
        const plan = await generateProjectStructure(description);

        if (!plan || !plan.modules || !Array.isArray(plan.modules)) {
            return res.status(500).json({ message: 'AI failed to generate a valid project structure.' });
        }

        // 3. Save to database
        const createdModules = [];
        const createdTasks = [];

        for (const mod of plan.modules) {
            // Create Module
            const newModule = await Module.create({
                name: mod.name,
                description: mod.description || '',
                projectId,
                ownerId: req.user._id, // Assign admin/creator as owner temporarily
                estimatedHours: mod.tasks?.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) || 0
            });
            createdModules.push(newModule);

            // Create Tasks for this Module
            if (mod.tasks && Array.isArray(mod.tasks)) {
                for (const t of mod.tasks) {
                    const newTask = await Task.create({
                        title: t.title,
                        description: t.description || '',
                        projectId,
                        moduleId: newModule._id,
                        priority: t.priority || 'medium',
                        estimatedHours: t.estimatedHours || 0,
                        currentStage: initialStage._id,
                        workflowHistory: [{
                            fromStage: null,
                            toStage: initialStage._id,
                            changedBy: req.user._id
                        }]
                    });
                    createdTasks.push(newTask);
                }
            }
        }

        // Log activity
        await logActivity(
            project._id, 
            { modulesCreated: createdModules.length, tasksCreated: createdTasks.length }, 
            req.user.organizationId
        );

        // Emit for Automation Engine (Slack/Notification)
        automationEngine.emit('project.scaffolded', {
            project: { id: project._id, name: project.name },
            user: { name: req.user.name },
            stats: {
                modulesCount: createdModules.length,
                tasksCount: createdTasks.length
            },
            organizationId: req.user.organizationId
        });

        res.status(201).json({
            success: true,
            message: 'Project scaffolded successfully',
            summary: plan.summary,
            stats: {
                modulesCreated: createdModules.length,
                tasksCreated: createdTasks.length
            },
            modules: plan.modules
        });

    } catch (error) {
        console.error('[Project Controller] Scaffold Error:', error);
        res.status(500).json({ message: error.message || 'Failed to scaffold project' });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    getProjectDashboard,
    getProjectTeamMembers,
    getProjectMembers,
    addProjectMember,
    removeProjectMember,
    scaffoldProject
};
