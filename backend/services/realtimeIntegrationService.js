const logger = require('../utils/logger');

class RealtimeIntegrationService {
    constructor() {
        this.app = null;
        this.io = null;
    }

    init(app) {
        this.app = app;
        this.io = app.get('io');
        logger.info('🚀 RealtimeIntegrationService initialized');
    }

    /**
     * Emit an integration event to the frontend
     * @param {string} organizationId - The organization ID
     * @param {string} service - The service name (e.g., 'slack', 'salesforce')
     * @param {Object} data - The event data
     */
    emitEvent(organizationId, service, data) {
        if (!this.io) {
            this.io = this.app?.get('io');
        }

        if (this.io) {
            const room = `org:${organizationId}:integrations`;
            this.io.to(room).emit('integration:update', {
                service,
                ...data,
                timestamp: new Date()
            });
            logger.debug(`[RealtimeIntegration] Emitted event for ${service} in room ${room}`);
        } else {
            logger.warn('[RealtimeIntegration] Socket.IO not initialized, cannot emit event');
        }
    }

    /**
     * Log an activity and emit a real-time update
     * @param {Object} integration - The integration document
     * @param {string} event - Event name (e.g., 'task_synced', 'sync_failed')
     * @param {string} status - 'success', 'warning', 'error', 'info'
     * @param {string} message - Human readable message
     * @param {Object} metadata - Optional metadata
     */
    async logActivity(integration, event, status, message, metadata = {}) {
        try {
            const entry = {
                event,
                status,
                message,
                timestamp: new Date(),
                metadata
            };

            // Keep log size manageable
            integration.activityLog.unshift(entry);
            if (integration.activityLog.length > 50) {
                integration.activityLog = integration.activityLog.slice(0, 50);
            }

            await integration.save();

            // Emit update to frontend
            this.emitEvent(integration.organizationId.toString(), integration.service, {
                type: 'activity',
                entry
            });

            return entry;
        } catch (error) {
            logger.error('[RealtimeIntegration] Error logging activity:', error);
        }
    }

    /**
     * Update integration status and notify frontend
     */
    async updateStatus(integration, status, error = null) {
        try {
            integration.status = status;
            if (error) {
                integration.lastError = {
                    message: error,
                    timestamp: new Date()
                };
            } else {
                integration.lastSync = new Date();
                integration.lastError = undefined;
            }

            await integration.save();

            this.emitEvent(integration.organizationId.toString(), integration.service, {
                type: 'status_change',
                status,
                error,
                lastSync: integration.lastSync
            });
        } catch (err) {
            logger.error('[RealtimeIntegration] Error updating status:', err);
        }
    }
}

module.exports = new RealtimeIntegrationService();
