const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task'); // Validation
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * @desc    Start a timer
 * @route   POST /api/time/start
 * @access  Private
 */
const checkActiveTimer = async (userId) => {
    const active = await TimeEntry.findOne({ userId, endTime: null });
    if (active) {
        throw new ConflictError('You already have an active timer running');
    }
};

const startTimeEntry = catchAsync(async (req, res) => {
    const { taskId, description, billable } = req.body;

    await checkActiveTimer(req.user._id);

    const task = await Task.findById(taskId);
    if (!task) {
        throw new NotFoundError('Task not found');
    }

    const timeEntry = await TimeEntry.create({
        userId: req.user._id,
        taskId,
        projectId: task.projectId, // Fixed: was task.project, should be task.projectId
        startTime: new Date(),
        description: description || task.title,
        billable: billable !== undefined ? billable : true
    });

    logger.info('Timer started', { entryId: timeEntry._id, userId: req.user._id });

    res.status(201).json({
        success: true,
        data: timeEntry
    });
});

/**
 * @desc    Stop active timer
 * @route   POST /api/time/stop
 * @access  Private
 */
const stopTimeEntry = catchAsync(async (req, res) => {
    const timeEntry = await TimeEntry.findOne({ userId: req.user._id, endTime: null });

    if (!timeEntry) {
        throw new NotFoundError('No active timer found');
    }

    timeEntry.endTime = new Date();
    await timeEntry.save(); // Duration calculated in pre-save

    res.json({
        success: true,
        data: timeEntry
    });
});

/**
 * @desc    Get active timer
 * @route   GET /api/time/active
 * @access  Private
 */
const getActiveTimer = catchAsync(async (req, res) => {
    const timeEntry = await TimeEntry.findOne({ userId: req.user._id, endTime: null })
        .populate('taskId', 'title project');

    res.json({
        success: true,
        data: timeEntry
    });
});

/**
 * @desc    Get time entries (filtered)
 * @route   GET /api/time
 * @access  Private
 */
const getTimeEntries = catchAsync(async (req, res) => {
    const { taskId, projectId, startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (taskId) query.taskId = taskId;
    if (projectId) query.projectId = projectId;
    if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const entries = await TimeEntry.find(query)
        .populate('taskId', 'title')
        .sort({ startTime: -1 })
        .limit(100);

    res.json({
        success: true,
        data: entries
    });
});

/**
 * @desc    Create manual entry
 * @route   POST /api/time
 * @access  Private
 */
const createManualEntry = catchAsync(async (req, res) => {
    const { taskId, startTime, endTime, description } = req.body;

    const task = await Task.findById(taskId);
    if (!task) throw new NotFoundError('Task not found');

    const entry = await TimeEntry.create({
        userId: req.user._id,
        taskId,
        projectId: task.projectId, // Fixed: was task.project, should be task.projectId
        startTime,
        endTime,
        description,
        isManual: true
    });

    res.status(201).json({
        success: true,
        data: entry
    });
});

module.exports = {
    startTimeEntry,
    stopTimeEntry,
    getActiveTimer,
    getTimeEntries,
    createManualEntry
};
