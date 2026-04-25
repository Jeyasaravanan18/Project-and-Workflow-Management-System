const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const WorkflowStage = require('../models/WorkflowStage');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const verifyPersonalPerformance = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a member user
        const member = await User.findOne({ role: 'member' });
        if (!member) {
            console.log('No member user found for testing.');
            process.exit(0);
        }

        console.log(`Testing for user: ${member.email} (${member._id})`);

        // Test the logic for personal performance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const tasksCompleted = await Task.countDocuments({
            assignedTo: member._id,
            completedAt: { $gte: thirtyDaysAgo }
        });

        const activeTasks = await Task.countDocuments({
            assignedTo: member._id,
            completedAt: { $exists: false }
        });

        console.log(`Metrics: Completed=${tasksCompleted}, Active=${activeTasks}`);

        const priorityTasks = await Task.find({
            assignedTo: member._id,
            completedAt: { $exists: false }
        })
        .sort({ dueDate: 1, priority: -1 })
        .limit(3);

        console.log(`Priority Tasks Found: ${priorityTasks.length}`);
        priorityTasks.forEach(t => console.log(` - ${t.title} (Due: ${t.dueDate})`));

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verifyPersonalPerformance();
