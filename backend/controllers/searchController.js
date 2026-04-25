const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @desc    Global Search
 * @route   GET /api/search
 * @access  Private
 */
const globalSearch = catchAsync(async (req, res) => {
    const { query, type } = req.query;

    if (!query) {
        return res.json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(query, 'i');
    let results = [];

    // Search Projects
    if (!type || type === 'projects') {
        const projects = await Project.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { key: searchRegex }
            ],
            // Check access: Admin sees all, Manager/Member sees their org docs
            organizationId: req.user.organizationId
        })
            .select('name key status')
            .limit(5)
            .lean();

        results.push(...projects.map(p => ({ ...p, type: 'project' })));
    }

    // Search Tasks
    if (!type || type === 'tasks') {
        const tasks = await Task.find({
            $or: [
                { title: searchRegex },
                { description: searchRegex },
                { taskKey: searchRegex }
            ],
            organizationId: req.user.organizationId
        })
            .select('title taskKey status priority')
            .limit(5)
            .lean();

        results.push(...tasks.map(t => ({ ...t, type: 'task' })));
    }

    // Search Users
    if (!type || type === 'users') {
        const users = await User.find({
            $or: [
                { name: searchRegex },
                { email: searchRegex }
            ],
            organizationId: req.user.organizationId
        })
            .select('name email avatar role')
            .limit(5)
            .lean();

        results.push(...users.map(u => ({ ...u, type: 'user' })));
    }

    res.json({
        success: true,
        data: results
    });
});

module.exports = {
    globalSearch
};
