const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const ORG_ID = '6962770c19533f153c6bdd77';
const USER_ID = '6962770c19533f153c6bdd79';

const Automation = mongoose.model('Automation', new mongoose.Schema({}, { strict: false }));

const expandSlackNotifications = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        // 1. Rule: Status Changed
        console.log('Updating Status Change Automation...');
        await Automation.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), name: 'Slack: Status Update' },
            {
                name: 'Slack: Status Update',
                description: 'Notify Slack when a task status changes.',
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                enabled: true,
                trigger: {
                    type: 'event',
                    config: { eventType: 'task.status_changed' }
                },
                actions: [{
                    order: 1,
                    type: 'slack_notification',
                    config: {
                        text: '📂 *Status Updated*\n*Task:* {{task.title}}\n*New Stage:* {{task.currentStage.name}}\n*Updated By:* {{user.name}}'
                    }
                }],
                createdBy: new mongoose.Types.ObjectId(USER_ID)
            },
            { upsert: true }
        );

        // 2. Rule: New Comment
        console.log('Updating Comment Automation...');
        await Automation.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), name: 'Slack: New Comment' },
            {
                name: 'Slack: New Comment',
                description: 'Notify Slack when a new comment is posted.',
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                enabled: true,
                trigger: {
                    type: 'event',
                    config: { eventType: 'comment.created' }
                },
                actions: [{
                    order: 1,
                    type: 'slack_notification',
                    config: {
                        text: '💬 *New Task Comment*\n*Task:* {{task.title}}\n*From:* {{user.name}}\n*Comment:* "{{comment.text}}"'
                    }
                }],
                createdBy: new mongoose.Types.ObjectId(USER_ID)
            },
            { upsert: true }
        );

        // 3. Rule: Daily Overdue Digest (Scheduled 8am)
        console.log('Updating Overdue Digest Automation...');
        await Automation.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), name: 'Slack: Daily Overdue Digest' },
            {
                name: 'Slack: Daily Overdue Digest',
                description: 'Daily summary of overdue tasks.',
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                enabled: true,
                trigger: {
                    type: 'schedule',
                    config: { schedule: '0 8 * * *' } // 8 AM Daily
                },
                actions: [{
                    order: 1,
                    type: 'slack_notification',
                    config: {
                        text: '⚠️ *Daily Overdue Alert*\nThere are currently overdue tasks that require your attention. Please check the dashboard for a full list.'
                    }
                }],
                createdBy: new mongoose.Types.ObjectId(USER_ID)
            },
            { upsert: true }
        );

        console.log('\n✅ Expanded Slack Notifications successfully registered!');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

expandSlackNotifications();
