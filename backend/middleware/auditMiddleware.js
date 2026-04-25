const AuditLog = require('../models/AuditLog');

/**
 * Middleware to capture and log significant changes for audit purposes
 */
const auditLogger = (action, resourceType) => {
    return async (req, res, next) => {
        // Capture original response.json to intercept the data
        const originalJson = res.json;
        
        res.json = function (data) {
            // Only log successful modifications (POST, PUT, DELETE)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Record audit log asynchronously so it doesn't block the response
                const logData = {
                    userId: req.user?._id,
                    organizationId: req.user?.organizationId,
                    action: action || `${req.method}_${resourceType.toUpperCase()}`,
                    resourceType: resourceType,
                    resourceId: data._id || req.params.id || 'N/A',
                    ipAddress: req.ip || req.connection.remoteAddress,
                    userAgent: req.get('user-agent'),
                    changes: {
                        newValue: req.method !== 'DELETE' ? req.body : null,
                        oldValue: req.oldResource || null // Populated by some controllers if needed
                    }
                };

                if (logData.userId && logData.organizationId) {
                    AuditLog.create(logData).catch(err => 
                        console.error('[AuditMiddleware] Error creating log:', err)
                    );
                }
            }
            
            return originalJson.call(this, data);
        };

        next();
    };
};

module.exports = auditLogger;
