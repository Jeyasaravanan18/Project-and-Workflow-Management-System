const Integration = require('../models/Integration');
const realtimeIntegrationService = require('../services/realtimeIntegrationService');

// Integration catalog with metadata
const INTEGRATION_CATALOG = [
    {
        id: 'slack',
        name: 'Slack',
        category: 'communication',
        description: 'Send real-time notifications to Slack channels when tasks are created, updated, or completed.',
        logo: '💬',
        popular: true,
        setupType: 'webhook',
        fields: [
            { name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://hooks.slack.com/services/...' },
            { name: 'channel', label: 'Default Channel', type: 'text', placeholder: '#general' }
        ],
        documentation: 'https://api.slack.com/messaging/webhooks',
        features: ['Real-time notifications', 'Custom channels', 'Rich message formatting']
    },
    {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        category: 'communication',
        description: 'Post updates to Microsoft Teams channels and collaborate with your team.',
        logo: '👥',
        popular: true,
        setupType: 'webhook',
        fields: [
            { name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://outlook.office.com/webhook/...' }
        ],
        documentation: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors',
        features: ['Team notifications', 'Adaptive cards', 'Channel integration']
    },
    {
        id: 'discord',
        name: 'Discord',
        category: 'communication',
        description: 'Send notifications to Discord servers and channels.',
        logo: '🎮',
        popular: false,
        setupType: 'webhook',
        fields: [
            { name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://discord.com/api/webhooks/...' }
        ],
        documentation: 'https://discord.com/developers/docs/resources/webhook',
        features: ['Server notifications', 'Embeds', 'Mentions']
    },
    {
        id: 'github',
        name: 'GitHub',
        category: 'development',
        description: 'Link tasks to pull requests, issues, and commits. Auto-update task status when PRs are merged.',
        logo: '🐙',
        popular: true,
        setupType: 'webhook',
        fields: [
            { name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true, placeholder: 'https://your-domain.com/api/webhooks/github' },
            { name: 'apiKey', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_...' }
        ],
        documentation: 'https://docs.github.com/en/developers/webhooks-and-events/webhooks',
        features: ['PR linking', 'Auto-status updates', 'Commit tracking']
    },
    {
        id: 'gitlab',
        name: 'GitLab',
        category: 'development',
        description: 'Integrate with GitLab for merge requests and CI/CD pipeline updates.',
        logo: '🦊',
        popular: false,
        setupType: 'webhook',
        fields: [
            { name: 'webhookUrl', label: 'Webhook URL', type: 'url', required: true },
            { name: 'apiKey', label: 'Access Token', type: 'password' }
        ],
        documentation: 'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html',
        features: ['MR integration', 'Pipeline status', 'Issue sync']
    },
    {
        id: 'sendgrid',
        name: 'SendGrid',
        category: 'email',
        description: 'Send professional email notifications with custom templates and tracking.',
        logo: '📧',
        popular: true,
        setupType: 'api_key',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'SG...' },
            { name: 'fromEmail', label: 'From Email', type: 'email', placeholder: 'notifications@yourcompany.com' }
        ],
        documentation: 'https://docs.sendgrid.com/api-reference',
        features: ['Email templates', 'Delivery tracking', 'Analytics']
    },
    {
        id: 'google-drive',
        name: 'Google Drive',
        category: 'storage',
        description: 'Attach files from Google Drive to tasks and sync project documents.',
        logo: '📁',
        popular: true,
        setupType: 'api_key',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true },
            { name: 'folderId', label: 'Default Folder ID', type: 'text', placeholder: 'Optional: drive-folder-id' }
        ],
        documentation: 'https://developers.google.com/drive/api',
        features: ['File attachments', 'Document sync', 'Shared folders']
    },
    {
        id: 'google-calendar',
        name: 'Google Calendar',
        category: 'productivity',
        description: 'Sync task deadlines to Google Calendar and schedule team meetings.',
        logo: '📅',
        popular: true,
        setupType: 'api_key',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true },
            { name: 'calendarId', label: 'Calendar ID', type: 'text', placeholder: 'primary' }
        ],
        documentation: 'https://developers.google.com/calendar/api',
        features: ['Deadline sync', 'Meeting scheduling', 'Reminders']
    },
    {
        id: 'trello',
        name: 'Trello',
        category: 'productivity',
        description: 'Sync tasks between your workflow system and Trello boards.',
        logo: '📋',
        popular: false,
        setupType: 'api_key',
        fields: [
            { name: 'apiKey', label: 'API Key', type: 'password', required: true },
            { name: 'token', label: 'Token', type: 'password', required: true }
        ],
        documentation: 'https://developer.atlassian.com/cloud/trello/rest',
        features: ['Board sync', 'Card creation', 'Label mapping']
    },
    {
        id: 'notion',
        name: 'Notion',
        category: 'productivity',
        description: 'Create and update Notion pages from your tasks and projects.',
        logo: '📝',
        popular: true,
        setupType: 'api_key',
        fields: [
            { name: 'apiKey', label: 'Internal Integration Token', type: 'password', required: true, placeholder: 'secret_...' },
            { name: 'databaseId', label: 'Database ID', type: 'text', required: true }
        ],
        documentation: 'https://developers.notion.com',
        features: ['Page creation', 'Database sync', 'Rich content']
    },
    {
        id: 'salesforce',
        name: 'Salesforce',
        category: 'productivity',
        description: 'Sync customer data, leads, and opportunities with your project management workflow.',
        logo: '☁️',
        popular: true,
        setupType: 'api_key',
        fields: [
            { name: 'instanceUrl', label: 'Instance URL', type: 'url', required: true, placeholder: 'https://your-domain.salesforce.com' },
            { name: 'apiKey', label: 'Consumer Key', type: 'text', required: true },
            { name: 'apiSecret', label: 'Consumer Secret', type: 'password', required: true }
        ],
        documentation: 'https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_what_is_rest_api.htm',
        features: ['Lead sync', 'Opportunity tracking', 'Bidirectional data flow']
    }
];

// @desc    Get all available integrations
// @route   GET /api/integrations/catalog
// @access  Private (Admin)
const getIntegrationCatalog = async (req, res) => {
    try {
        const { organizationId } = req.user;

        // Get connected integrations for this org
        const connectedIntegrations = await Integration.find({ organizationId });
        const connectedMap = {};
        connectedIntegrations.forEach(int => {
            connectedMap[int.service] = {
                status: int.status,
                lastSync: int.lastSync,
                config: int.config,
                activityLog: int.activityLog
            };
        });

        // Merge catalog with connection status
        const enrichedCatalog = INTEGRATION_CATALOG.map(integration => ({
            ...integration,
            connected: !!connectedMap[integration.id],
            connectionStatus: connectedMap[integration.id]?.status || 'disconnected',
            lastSync: connectedMap[integration.id]?.lastSync,
            activityLog: connectedMap[integration.id]?.activityLog || []
        }));

        res.json({
            success: true,
            data: enrichedCatalog
        });
    } catch (error) {
        console.error('[Integrations] Catalog error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get connected integrations
// @route   GET /api/integrations/connected
// @access  Private (Admin)
const getConnectedIntegrations = async (req, res) => {
    try {
        const { organizationId } = req.user;

        const integrations = await Integration.find({ organizationId })
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.json({
            success: true,
            data: integrations
        });
    } catch (error) {
        console.error('[Integrations] Get connected error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Connect/Configure an integration
// @route   POST /api/integrations/:service/connect
// @access  Private (Admin)
const connectIntegration = async (req, res) => {
    try {
        const { service } = req.params;
        const { config } = req.body;
        const { organizationId, _id: userId } = req.user;

        // Validate service exists in catalog
        const catalogItem = INTEGRATION_CATALOG.find(i => i.id === service);
        if (!catalogItem) {
            return res.status(404).json({ success: false, message: 'Integration not found' });
        }

        // Check if integration already exists
        let integration = await Integration.findOne({ organizationId, service });

        if (integration) {
            // Update existing
            integration.config = { ...integration.config, ...config };
            integration.updatedBy = userId;
            integration.status = 'pending';
        } else {
            // Create new
            integration = new Integration({
                organizationId,
                service,
                config,
                createdBy: userId,
                status: 'pending'
            });
        }

        await integration.save();

        // Log configuration change
        await realtimeIntegrationService.logActivity(
            integration,
            'integration_configured',
            'info',
            `${catalogItem.name} configuration updated by user`
        );

        res.json({
            success: true,
            data: integration,
            message: `${catalogItem.name} integration configured successfully`
        });
    } catch (error) {
        console.error('[Integrations] Connect error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Test integration connection
// @route   POST /api/integrations/:service/test
// @access  Private (Admin)
const testIntegration = async (req, res) => {
    try {
        const { service } = req.params;
        const { organizationId } = req.user;

        const integration = await Integration.findOne({ organizationId, service });
        if (!integration) {
            return res.status(404).json({ success: false, message: 'Integration not configured' });
        }

        const result = await integration.testConnection();

        if (result.success) {
            await realtimeIntegrationService.updateStatus(integration, 'connected');
            await realtimeIntegrationService.logActivity(
                integration,
                'connection_test',
                'success',
                result.message || 'Connection test successful'
            );
            res.json({
                success: true,
                message: result.message || 'Connection test successful!',
                data: integration
            });
        } else {
            await realtimeIntegrationService.updateStatus(integration, 'error', result.error);
            await realtimeIntegrationService.logActivity(
                integration,
                'connection_test',
                'error',
                result.error || 'Connection test failed'
            );
            res.status(400).json({
                success: false,
                message: result.error || 'Connection test failed'
            });
        }
    } catch (error) {
        console.error('[Integrations] Test error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Disconnect an integration
// @route   DELETE /api/integrations/:service
// @access  Private (Admin)
const disconnectIntegration = async (req, res) => {
    try {
        const { service } = req.params;
        const { organizationId } = req.user;

        const integration = await Integration.findOneAndDelete({ organizationId, service });
        if (!integration) {
            return res.status(404).json({ success: false, message: 'Integration not found' });
        }

        const catalogItem = INTEGRATION_CATALOG.find(i => i.id === service);
        res.json({
            success: true,
            message: `${catalogItem?.name || service} integration disconnected`
        });
    } catch (error) {
        console.error('[Integrations] Disconnect error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getIntegrationCatalog,
    getConnectedIntegrations,
    connectIntegration,
    testIntegration,
    disconnectIntegration,
    INTEGRATION_CATALOG
};
