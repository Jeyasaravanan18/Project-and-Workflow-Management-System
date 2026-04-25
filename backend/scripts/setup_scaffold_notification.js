const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const ORG_ID = '6962770c19533f153c6bdd77';
const USER_ID = '6962770c19533f153c6bdd79';

const Automation = mongoose.model('Automation', new mongoose.Schema({}, { strict: false }));

const setupScaffoldNotification = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        // 1. Rule: Summary Notification for AI Scaffolder
        console.log('Creating AI Scaffolder Summary Automation...');
        await Automation.findOneAndUpdate(
            { organizationId: new mongoose.Types.ObjectId(ORG_ID), name: 'Slack: AI Scaffolder Summary' },
            {
                name: 'Slack: AI Scaffolder Summary',
                description: 'Notify Slack with a summary when a project is scaffolded by AI.',
                organizationId: new mongoose.Types.ObjectId(ORG_ID),
                enabled: true,
                trigger: {
                    type: 'event',
                    config: { eventType: 'project.scaffolded' }
                },
                actions: [{
                    order: 1,
                    type: 'slack_notification',
                    config: {
                        text: '🚀 *AI Scaffolder Task Complete*\n\n*Project:* {{project.name}}\n*User:* {{user.name}}\n\n✅ Added *{{stats.modulesCount}} Modules* and *{{stats.tasksCount}} Tasks* successfully!'
                    }
                }],
                createdBy: new mongoose.Types.ObjectId(USER_ID)
            },
            { upsert: true }
        );

        console.log('\n✅ AI Scaffolder Summary Notification registered!');

    } catch (error) {
        console.error('Setup failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

setupScaffoldNotification();
