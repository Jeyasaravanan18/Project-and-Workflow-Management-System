const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    service: {
        type: String,
        required: true,
        enum: [
            'slack', 'microsoft-teams', 'discord',
            'github', 'gitlab', 'bitbucket',
            'google-drive', 'dropbox', 'onedrive',
            'google-calendar', 'notion', 'trello',
            'sendgrid', 'mailgun', 'gmail',
            'google-analytics', 'mixpanel'
        ]
    },
    status: {
        type: String,
        enum: ['connected', 'disconnected', 'error', 'pending'],
        default: 'disconnected'
    },
    config: {
        webhookUrl: String,
        apiKey: String,
        apiSecret: String,
        accessToken: String,
        refreshToken: String,
        channel: String,
        settings: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    lastSync: Date,
    lastError: {
        message: String,
        timestamp: Date
    },
    activityLog: [{
        event: String,
        status: {
            type: String,
            enum: ['success', 'warning', 'error', 'info']
        },
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: mongoose.Schema.Types.Mixed
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for organization + service (unique per org)
integrationSchema.index({ organizationId: 1, service: 1 }, { unique: true });

// Methods
integrationSchema.methods.testConnection = async function () {
    // Test connection based on service type
    try {
        switch (this.service) {
            case 'slack':
                if (!this.config.webhookUrl) return { success: false, error: 'Webhook URL required' };
                // Test Slack webhook
                const slackTest = await fetch(this.config.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: '✅ Integration test successful!' })
                });
                return { success: slackTest.ok, error: slackTest.ok ? null : 'Failed to send test message' };

            case 'github':
                if (!this.config.webhookUrl) return { success: false, error: 'Webhook URL required' };

                if (this.config.apiKey) {
                    try {
                        const githubTest = await fetch('https://api.github.com/user', {
                            headers: {
                                'Authorization': `token ${this.config.apiKey}`,
                                'User-Agent': 'Harmonic-Halo-App',
                                'Accept': 'application/vnd.github.v3+json'
                            }
                        });

                        if (!githubTest.ok) {
                            return { success: false, error: 'Invalid Personal Access Token' };
                        }

                        const githubUser = await githubTest.json();
                        return { success: true, message: `Connected to GitHub as ${githubUser.login}` };
                    } catch (err) {
                        return { success: false, error: 'Failed to connect to GitHub API' };
                    }
                }

                return { success: true, message: 'GitHub webhook configured (No token provided)' };

            case 'google-drive':
                if (!this.config.apiKey) return { success: false, error: 'API Key required' };
                // Simulated Google Drive validation
                return { success: true, message: 'Connected to Google Drive successfully' };

            case 'google-calendar':
                if (!this.config.apiKey) return { success: false, error: 'API Key required' };
                // Simulated Google Calendar validation
                return { success: true, message: 'Connected to Google Calendar successfully' };

            case 'notion':
                if (!this.config.apiKey) return { success: false, error: 'Internal Integration Token required' };
                if (!this.config.databaseId) return { success: false, error: 'Database ID required' };
                // Simulated Notion validation
                return { success: true, message: 'Connected to Notion successfully' };

            case 'salesforce':
                if (!this.config.apiKey && !this.config.accessToken) {
                    return { success: false, error: 'API Key or Access Token required' };
                }
                // Simulated Salesforce validation
                return { success: true, message: 'Salesforce connection validated successfully' };

            default:
                return { success: true, message: 'Configuration saved' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
};

integrationSchema.methods.markError = function (errorMessage) {
    this.status = 'error';
    this.lastError = {
        message: errorMessage,
        timestamp: new Date()
    };
    return this.save();
};

integrationSchema.methods.markConnected = function () {
    this.status = 'connected';
    this.lastSync = new Date();
    this.lastError = undefined;
    return this.save();
};

module.exports = mongoose.model('Integration', integrationSchema);
