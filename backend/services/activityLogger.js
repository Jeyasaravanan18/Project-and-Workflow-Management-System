const ActivityLog = require('../models/ActivityLog');

// Middleware to log activities
// Usage: router.post('/...', logActivity('CREATED_TASK', 'Task'), controller.createTask);
// NOTE: This assumes req.user is populated (so use after 'protect') 
// AND that the response object might contain the created entity ID if possible, 
// OR we log based on request parameters.
// A more robust approach wraps the controller or hooks into Mongoose middleware.
// For simplicity in this stack, we'll create a utility function to be called explicitly
// inside controllers, OR a middleware that runs AFTER the controller (using response interception).

// Let's implement an explicit helper function instead of middleware for better control over what gets logged
// as getting the "created entity ID" from pure middleware is tricky without intercepting res.send.

const logActivity = async (userId, action, entityType, entityId, metadata = {}, organizationId = null) => {
    try {
        const activityData = {
            userId,
            action,
            entityType,
            entityId,
            metadata
        };

        // Add organizationId if provided
        if (organizationId) {
            activityData.organizationId = organizationId;
        }

        await ActivityLog.create(activityData);
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't block the request if logging fails
    }
};

module.exports = { logActivity };
