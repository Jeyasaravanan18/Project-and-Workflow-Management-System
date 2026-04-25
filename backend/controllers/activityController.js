const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { Parser } = require('json2csv');

// @desc    Get recent activities for dashboard feed
// @route   GET /api/activities/recent
// @access  Private (Admin/Manager)
const getRecentActivities = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const limit = parseInt(req.query.limit) || 20;

        const activities = await ActivityLog.find({
            organizationId: orgId,
            actionType: { $in: ['create', 'update', 'delete'] } // Exclude view/auth spam
        })
            .populate('userId', 'name email')
            .populate({
                path: 'entityId',
                select: 'title name'
            })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();

        // Format activities for frontend
        const formattedActivities = activities.map(activity => ({
            id: activity._id,
            type: activity.action,
            actionType: activity.actionType,
            user: {
                id: activity.userId?._id,
                name: activity.userId?.name || 'Unknown User',
                email: activity.userId?.email
            },
            target: {
                type: activity.entityType,
                id: activity.entityId?._id,
                title: activity.entityId?.title || activity.entityId?.name || 'Unknown'
            },
            timestamp: activity.timestamp,
            metadata: activity.metadata
        }));

        res.json({
            success: true,
            activities: formattedActivities,
            count: formattedActivities.length
        });

    } catch (error) {
        console.error('[Activities] Recent activities error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get audit trail with advanced filtering
// @route   GET /api/activities/audit
// @access  Private (Admin)
const getAuditTrail = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const {
            userId,
            actionType,
            entityType,
            startDate,
            endDate,
            isSecurityEvent,
            severity,
            page = 1,
            limit = 50,
            search
        } = req.query;

        // Build query
        const query = { organizationId: orgId };

        if (userId) query.userId = userId;
        if (actionType) query.actionType = actionType;
        if (entityType) query.entityType = entityType;
        if (isSecurityEvent === 'true') query.isSecurityEvent = true;
        if (severity) query.severity = severity;

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const [activities, total] = await Promise.all([
            ActivityLog.find(query)
                .populate('userId', 'name email role')
                .populate({
                    path: 'entityId',
                    select: 'title name'
                })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ActivityLog.countDocuments(query)
        ]);

        // Get filter options for UI
        const [users, actionTypes, entityTypes] = await Promise.all([
            User.find({ organizationId: orgId }).select('name email').lean(),
            ActivityLog.distinct('actionType', { organizationId: orgId }),
            ActivityLog.distinct('entityType', { organizationId: orgId })
        ]);

        // Get security event count
        const securityEventCount = await ActivityLog.countDocuments({
            organizationId: orgId,
            isSecurityEvent: true,
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });

        // Get critical events
        const criticalEvents = await ActivityLog.find({
            organizationId: orgId,
            severity: 'critical',
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        })
            .populate('userId', 'name email')
            .limit(5)
            .lean();

        res.json({
            success: true,
            activities: activities.map(a => ({
                id: a._id,
                user: {
                    id: a.userId?._id,
                    name: a.userId?.name || 'Unknown',
                    email: a.userId?.email,
                    role: a.userId?.role
                },
                action: a.action,
                actionType: a.actionType,
                entityType: a.entityType,
                entityName: a.entityId?.title || a.entityId?.name || 'N/A',
                timestamp: a.timestamp,
                ipAddress: a.ipAddress,
                isSecurityEvent: a.isSecurityEvent,
                severity: a.severity,
                metadata: a.metadata
            })),
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            },
            filters: {
                users: users.map(u => ({ id: u._id, name: u.name, email: u.email })),
                actionTypes,
                entityTypes
            },
            securitySummary: {
                eventCount: securityEventCount,
                criticalEvents: criticalEvents.map(e => ({
                    id: e._id,
                    action: e.action,
                    user: e.userId?.name || 'Unknown',
                    timestamp: e.timestamp,
                    severity: e.severity
                }))
            }
        });

    } catch (error) {
        console.error('[Activities] Audit trail error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Export audit trail to CSV
// @route   POST /api/activities/export
// @access  Private (Admin)
const exportAuditTrail = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const { format = 'csv', ...filters } = req.body;

        // Build query from filters
        const query = { organizationId: orgId };
        if (filters.userId) query.userId = filters.userId;
        if (filters.actionType) query.actionType = filters.actionType;
        if (filters.entityType) query.entityType = filters.entityType;
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        // Fetch all matching activities
        const activities = await ActivityLog.find(query)
            .populate('userId', 'name email role')
            .populate({
                path: 'entityId',
                select: 'title name'
            })
            .sort({ timestamp: -1 })
            .limit(10000) // Safety limit
            .lean();

        // Format for export
        const exportData = activities.map(a => ({
            Timestamp: new Date(a.timestamp).toISOString(),
            User: a.userId?.name || 'Unknown',
            Email: a.userId?.email || 'N/A',
            Role: a.userId?.role || 'N/A',
            Action: a.action,
            ActionType: a.actionType,
            EntityType: a.entityType,
            EntityName: a.entityId?.title || a.entityId?.name || 'N/A',
            IPAddress: a.ipAddress || 'N/A',
            SecurityEvent: a.isSecurityEvent ? 'Yes' : 'No',
            Severity: a.severity,
            Details: JSON.stringify(a.metadata || {})
        }));

        if (format === 'csv') {
            const parser = new Parser();
            const csv = parser.parse(exportData);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="audit-trail-${Date.now()}.csv"`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: exportData,
                count: exportData.length
            });
        }

    } catch (error) {
        console.error('[Activities] Export error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get activity statistics
// @route   GET /api/activities/stats
// @access  Private (Admin)
const getActivityStats = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const stats = await ActivityLog.aggregate([
            {
                $match: {
                    organizationId: orgId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        actionType: '$actionType',
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.date': 1 }
            }
        ]);

        res.json({
            success: true,
            stats,
            period: { days, startDate }
        });

    } catch (error) {
        console.error('[Activities] Stats error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Legacy endpoint for backward compatibility
const getActivities = async (req, res) => {
    try {
        const orgId = req.user.organizationId;
        const { userId, entityType, limit } = req.query;
        const query = { organizationId: orgId };

        if (userId) query.userId = userId;
        if (entityType) query.entityType = entityType;

        const logs = await ActivityLog.find(query)
            .populate('userId', 'name email')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit) || 100);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRecentActivities,
    getAuditTrail,
    exportAuditTrail,
    getActivityStats,
    getActivities
};
