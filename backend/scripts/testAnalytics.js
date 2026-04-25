// Quick test script to verify analytics data
// Run with: node backend/scripts/testAnalytics.js

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const WorkflowStage = require('../models/WorkflowStage');

async function testAnalyticsData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Count documents
        const projectCount = await Project.countDocuments();
        const taskCount = await Task.countDocuments();
        const userCount = await User.countDocuments();
        const stageCount = await WorkflowStage.countDocuments();

        console.log('\n=== Database Counts ===');
        console.log(`Projects: ${projectCount}`);
        console.log(`Tasks: ${taskCount}`);
        console.log(`Users: ${userCount}`);
        console.log(`Workflow Stages: ${stageCount}`);

        // Check if tasks have workflow stages
        const tasksWithStages = await Task.countDocuments({ currentStage: { $exists: true, $ne: null } });
        const tasksWithoutStages = taskCount - tasksWithStages;

        console.log('\n=== Task Stage Status ===');
        console.log(`Tasks with stages: ${tasksWithStages}`);
        console.log(`Tasks without stages: ${tasksWithoutStages}`);

        // Sample tasks by status
        if (taskCount > 0) {
            const tasksByStage = await Task.aggregate([
                {
                    $lookup: {
                        from: 'workflowstages',
                        localField: 'currentStage',
                        foreignField: '_id',
                        as: 'stageInfo'
                    }
                },
                { $unwind: { path: '$stageInfo', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: { $ifNull: ['$stageInfo.name', 'No Stage'] },
                        count: { $sum: 1 }
                    }
                }
            ]);

            console.log('\n=== Tasks by Stage ===');
            tasksByStage.forEach(stage => {
                console.log(`${stage._id}: ${stage.count}`);
            });
        }

        // Check user workload
        if (userCount > 0) {
            const users = await User.find().select('name email role').limit(5);
            console.log('\n=== Sample Users ===');
            for (const user of users) {
                const activeTasks = await Task.countDocuments({
                    assignedTo: user._id,
                    completedAt: { $exists: false }
                });
                console.log(`${user.name} (${user.role}): ${activeTasks} active tasks`);
            }
        }

        console.log('\n✓ Analytics data check complete');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testAnalyticsData();
