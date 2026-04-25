const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const allTasks = await Task.find({}).populate('assignedTo', 'name email organizationId');

        console.log(`Found ${allTasks.length} tasks total:\n`);

        const tasksByOrg = {};
        allTasks.forEach(t => {
            const orgId = t.organizationId?.toString() || 'no-org';
            if (!tasksByOrg[orgId]) {
                tasksByOrg[orgId] = [];
            }
            tasksByOrg[orgId].push(t);
        });

        for (const [orgId, tasks] of Object.entries(tasksByOrg)) {
            console.log(`\n📁 Organization: ${orgId}`);
            console.log(`   Tasks: ${tasks.length}`);
            tasks.forEach(t => {
                console.log(`      - "${t.title}" → ${t.assignedTo?.name || 'Unassigned'}`);
            });
        }

        // Show the correct organization
        const admin = await User.findOne({ email: 'tcs@gmail.com' });
        console.log(`\n✅ Your organization (tcs admin): ${admin.organizationId}`);
        console.log(`   This is where tasks should be to show in workload analytics.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
