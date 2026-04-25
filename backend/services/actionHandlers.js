const Notification = require('../models/Notification');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Integration = require('../models/Integration');
const realtimeIntegrationService = require('./realtimeIntegrationService');

// Helper to resolve dynamic values
const resolveValue = (value, context) => {
    if (typeof value === 'string' && value.startsWith('context.')) {
        const path = value.replace('context.', '');
        return getNestedValue(context, path);
    }
    return value;
};

// Helper to get nested value
const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Action Handlers
const actionHandlers = {
    // Send in-app notification
    send_notification: async (config, context) => {
        try {
            const recipientId = resolveValue(config.recipient, context);
            const message = config.message;
            const type = config.type || 'info';

            await Notification.create({
                userId: recipientId,
                type,
                title: config.title || 'Automation Notification',
                message,
                relatedTask: context.task?._id,
                relatedProject: context.project?._id
            });

            return { success: true, message: 'Notification sent' };
        } catch (error) {
            console.error('[ActionHandler] send_notification error:', error);
            throw error;
        }
    },

    // Create task
    create_task: async (config, context) => {
        try {
            const taskData = {
                title: config.title,
                description: config.description || '',
                projectId: resolveValue(config.projectId, context) || context.task?.projectId,
                assignee: resolveValue(config.assignee, context),
                priority: config.priority || 'Medium',
                status: config.status || 'To Do',
                estimatedHours: config.estimatedHours,
                dueDate: config.dueDate,
                organizationId: context.organizationId || context.task?.organizationId
            };

            const task = await Task.create(taskData);

            return { success: true, taskId: task._id, message: 'Task created' };
        } catch (error) {
            console.error('[ActionHandler] create_task error:', error);
            throw error;
        }
    },

    // Update task
    update_task: async (config, context) => {
        try {
            const taskId = resolveValue(config.taskId, context) || context.task?._id;

            if (!taskId) {
                throw new Error('Task ID not found');
            }

            const updates = {};
            if (config.status) updates.status = config.status;
            if (config.priority) updates.priority = config.priority;
            if (config.assignee) updates.assignee = resolveValue(config.assignee, context);
            if (config.dueDate) updates.dueDate = config.dueDate;
            if (config.estimatedHours) updates.estimatedHours = config.estimatedHours;

            await Task.findByIdAndUpdate(taskId, updates);

            return { success: true, message: 'Task updated' };
        } catch (error) {
            console.error('[ActionHandler] update_task error:', error);
            throw error;
        }
    },

    // Assign task
    assign_task: async (config, context) => {
        try {
            const taskId = resolveValue(config.taskId, context) || context.task?._id;
            const assigneeId = resolveValue(config.assignee, context);

            if (!taskId) {
                throw new Error('Task ID not found');
            }

            await Task.findByIdAndUpdate(taskId, { assignee: assigneeId });

            return { success: true, message: 'Task assigned' };
        } catch (error) {
            console.error('[ActionHandler] assign_task error:', error);
            throw error;
        }
    },

    // Send email
    send_email: async (config, context) => {
        try {
            // Get recipient email
            let toEmail = config.to;
            if (config.to && config.to.startsWith('context.')) {
                const userId = resolveValue(config.to, context);
                const user = await User.findById(userId);
                toEmail = user?.email;
            }

            if (!toEmail) {
                throw new Error('Recipient email not found');
            }

            // Create transporter (configure with your email service)
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });

            // Send email
            await transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@workflowos.com',
                to: toEmail,
                subject: config.subject,
                text: config.body,
                html: config.htmlBody || config.body
            });

            return { success: true, message: 'Email sent' };
        } catch (error) {
            console.error('[ActionHandler] send_email error:', error);
            throw error;
        }
    },

    // Create comment
    create_comment: async (config, context) => {
        try {
            const taskId = resolveValue(config.taskId, context) || context.task?._id;

            if (!taskId) {
                throw new Error('Task ID not found');
            }

            await Comment.create({
                taskId,
                userId: config.userId || 'system',
                text: config.text
            });

            return { success: true, message: 'Comment created' };
        } catch (error) {
            console.error('[ActionHandler] create_comment error:', error);
            throw error;
        }
    },

    // Update project
    update_project: async (config, context) => {
        try {
            const projectId = resolveValue(config.projectId, context) || context.project?._id || context.task?.projectId;

            if (!projectId) {
                throw new Error('Project ID not found');
            }

            const updates = {};
            if (config.status) updates.status = config.status;
            if (config.progress) updates.progress = config.progress;

            await Project.findByIdAndUpdate(projectId, updates);

            return { success: true, message: 'Project updated' };
        } catch (error) {
            console.error('[ActionHandler] update_project error:', error);
            throw error;
        }
    },

    // Delay/Wait
    delay: async (config, context) => {
        const duration = config.duration || 1000; // milliseconds
        await new Promise(resolve => setTimeout(resolve, duration));
        return { success: true, message: `Delayed ${duration}ms` };
    },

    // Send webhook
    send_webhook: async (config, context) => {
        try {
            const url = config.url;
            const method = config.method || 'POST';
            const payload = config.payload || context;

            const response = await axios({
                method,
                url,
                data: payload,
                headers: config.headers || {}
            });

            return {
                success: true,
                message: 'Webhook sent',
                statusCode: response.status
            };
        } catch (error) {
            console.error('[ActionHandler] send_webhook error:', error);
            throw error;
        }
    },

    // Slack Notification via Integration
    slack_notification: async (config, context) => {
        try {
            const orgId = context.organizationId || context.task?.organizationId;
            const integration = await Integration.findOne({ organizationId: orgId, service: 'slack', status: 'connected' });

            if (!integration) {
                throw new Error('Slack integration not connected');
            }

            const webhookUrl = integration.config.webhookUrl;
            const channel = config.channel || integration.config.channel;
            const text = resolveValue(config.text, context);

            await axios.post(webhookUrl, {
                text,
                channel: channel
            });

            await realtimeIntegrationService.logActivity(
                integration,
                'slack_message_sent',
                'success',
                `Notification sent to ${channel || 'default channel'}`,
                { text }
            );

            return { success: true, message: 'Slack notification sent' };
        } catch (error) {
            console.error('[ActionHandler] slack_notification error:', error);
            throw error;
        }
    },

    // Salesforce Sync via Integration
    salesforce_sync: async (config, context) => {
        try {
            const orgId = context.organizationId || context.task?.organizationId;
            const integration = await Integration.findOne({ organizationId: orgId, service: 'salesforce', status: 'connected' });

            if (!integration) {
                throw new Error('Salesforce integration not connected');
            }

            // Simulated Salesforce API call
            const objectType = config.objectType || 'Lead';
            const action = config.action || 'UPSERT';
            const data = resolveValue(config.data, context);

            // Log the activity real-time
            await realtimeIntegrationService.logActivity(
                integration,
                'salesforce_sync',
                'success',
                `${action} ${objectType} in Salesforce`,
                { objectType, action, dataSummary: '...' }
            );

            return { success: true, message: `Salesforce ${objectType} ${action} successful` };
        } catch (error) {
            console.error('[ActionHandler] salesforce_sync error:', error);
            throw error;
        }
    },

    // Google Drive: Create Folder
    create_drive_folder: async (config, context) => {
        try {
            const orgId = context.organizationId || context.task?.organizationId;
            const integration = await Integration.findOne({ organizationId: orgId, service: 'google-drive', status: 'connected' });

            if (!integration) throw new Error('Google Drive not connected');

            const folderName = resolveValue(config.folderName, context);
            
            // Simulated API call
            await realtimeIntegrationService.logActivity(
                integration,
                'drive_folder_created',
                'success',
                `Folder "${folderName}" created in Google Drive`,
                { folderName }
            );

            return { success: true, message: 'Drive folder created' };
        } catch (error) {
            console.error('[ActionHandler] create_drive_folder error:', error);
            throw error;
        }
    },

    // Google Calendar: Sync Event
    sync_calendar_event: async (config, context) => {
        try {
            const orgId = context.organizationId || context.task?.organizationId;
            const integration = await Integration.findOne({ organizationId: orgId, service: 'google-calendar', status: 'connected' });

            if (!integration) throw new Error('Google Calendar not connected');

            const eventTitle = resolveValue(config.title, context);
            
            // Simulated API call
            await realtimeIntegrationService.logActivity(
                integration,
                'calendar_event_synced',
                'success',
                `Event "${eventTitle}" synced to Google Calendar`,
                { eventTitle }
            );

            return { success: true, message: 'Calendar event synced' };
        } catch (error) {
            console.error('[ActionHandler] sync_calendar_event error:', error);
            throw error;
        }
    },

    // Notion: Update Page
    notion_page_update: async (config, context) => {
        try {
            const orgId = context.organizationId || context.task?.organizationId;
            const integration = await Integration.findOne({ organizationId: orgId, service: 'notion', status: 'connected' });

            if (!integration) throw new Error('Notion not connected');

            const pageTitle = resolveValue(config.title, context);
            
            // Simulated API call
            await realtimeIntegrationService.logActivity(
                integration,
                'notion_page_updated',
                'success',
                `Notion page "${pageTitle}" updated`,
                { pageTitle }
            );

            return { success: true, message: 'Notion page updated' };
        } catch (error) {
            console.error('[ActionHandler] notion_page_update error:', error);
            throw error;
        }
    }
};

module.exports = actionHandlers;
