const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
require('dotenv').config();

const seedWorkloadData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const admin = await User.findOne({ email: 'tcs@gmail.com' });
        if (!admin) {
            console.error('❌ Admin user not found.');
            process.exit(1);
        }

        console.log(`Found admin: ${admin.name}`);

        const allUsers = await User.find({ organizationId: admin.organizationId });
        console.log(`Found ${allUsers.length} users:`);
        allUsers.forEach((u, i) => console.log(`  ${i}. ${u.name} (${u.role})`));

        const project = await Project.findOne({ organizationId: admin.organizationId });
        if (!project) {
            console.error('❌ No project found.');
            process.exit(1);
        }
        console.log(`Using project: ${project.name}`);

        const taskTemplates = [
            { title: 'Design Homepage UI', hours: 8, userIndex: 0 },
            { title: 'Implement Authentication', hours: 10, userIndex: 0 },
            { title: 'Setup CI/CD Pipeline', hours: 6, userIndex: 0 },
            { title: 'Write Unit Tests', hours: 5, userIndex: 0 },
            { title: 'Code Review Sprint 1', hours: 4, userIndex: 0 },
            { title: 'Fix Critical Bugs', hours: 8, userIndex: 0 },
            { title: 'Create Dashboard', hours: 10, userIndex: 1 },
            { title: 'API Integration', hours: 6, userIndex: 1 },
            { title: 'Database Optimization', hours: 5, userIndex: 1 },
            { title: 'Update Documentation', hours: 3, userIndex: 2 },
            { title: 'Client Meeting Prep', hours: 2, userIndex: 2 },
            { title: 'Performance Testing', hours: 8, userIndex: 3 },
            { title: 'Security Audit', hours: 10, userIndex: 3 },
            { title: 'Deploy to Production', hours: 6, userIndex: 3 },
        ];

        let createdCount = 0;
        for (const taskData of taskTemplates) {
            if (taskData.userIndex >= allUsers.length) continue;

            const existing = await Task.findOne({
                title: taskData.title,
                projectId: project._id
            });

            if (!existing) {
                await Task.create({
                    title: taskData.title,
                    description: `Task: ${taskData.title}`,
                    projectId: project._id,
                    assignedTo: allUsers[taskData.userIndex]._id,
                    estimatedHours: taskData.hours,
                    priority: 'medium',
                    status: 'in-progress',
                    organizationId: admin.organizationId,
                    createdBy: admin._id
                });
                createdCount++;
                console.log(`✅ "${taskData.title}" → ${allUsers[taskData.userIndex].name}`);
            }
        }

        console.log(`\n✅ Created ${createdCount} new tasks`);

        const totalTasks = await Task.countDocuments({
            organizationId: admin.organizationId,
            completedAt: { $exists: false }
        });

        console.log('\n📊 Summary:');
        console.log(`   Users: ${allUsers.length}`);
        console.log(`   Active Tasks: ${totalTasks}`);
        console.log('\n🔄 Refresh /analytics/workload now!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedWorkloadData();
