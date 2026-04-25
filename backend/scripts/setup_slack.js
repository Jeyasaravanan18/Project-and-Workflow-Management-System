const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;
const ORG_ID = '6962770c19533f153c6bdd77';
const USER_ID = '6962770c19533f153c6bdd79';

// Define Minimal Models
const Integration = mongoose.model('Integration', new mongoose.Schema({}, { strict: false }));
const Automation = mongoose.model('Automation', new mongoose.Schema({}, { strict: false }));

const setupSlack = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        // 1. Create or Update Slack Integration
        console.log('Upserting Slack Integration...');
        const integration = await Integration.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), service: 'slack' },
            {
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                service: 'slack',
                status: 'connected',
                config: {
                    webhookUrl: SLACK_URL,
                    channel: '#general' // Default channel
                },
                createdBy: new mongoose.Types.ObjectId(USER_ID),
                lastSync: new Date()
            },
            { upsert: true, new: true }
        );
        console.log('Integration ID:', integration._id);

        // 2. Create Automation Rule: Notify Slack on Task Creation
        console.log('Creating Automation Rule...');
        const automation = await Automation.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), name: 'Slack Notification: New Task' },
            {
                name: 'Slack Notification: New Task',
                description: 'Automatically send a message to Slack when a new task is created.',
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                enabled: true,
                trigger: {
                    type: 'event',
                    config: {
                        eventType: 'task.created'
                    }
                },
                actions: [
                    {
                        order: 1,
                        type: 'slack_notification',
                        config: {
                            text: '🚀 *New Task Created*\n*Title:* {{task.title}}\n*Priority:* {{task.priority}}\n*Project:* {{task.projectId.name}}\n*Assigned To:* {{task.assignedTo[0].name}}'
                        }
                    }
                ],
                createdBy: new mongoose.Types.ObjectId(USER_ID)
            },
            { upsert: true, new: true }
        );
        console.log('Automation ID:', automation._id);

        console.log('\n✅ Slack Integration Setup Complete!');
        console.log('You will now receive notifications in Slack whenever a new task is created.');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

setupSlack();
