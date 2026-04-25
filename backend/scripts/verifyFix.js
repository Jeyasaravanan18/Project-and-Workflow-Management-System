const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const admin = await User.findOne({ email: 'tcs@gmail.com' });
        const orgId = admin.organizationId.toString();

        console.log(`Checking organization: ${orgId}\n`);

        const tasksInOrg = await Task.find({ organizationId: orgId })
            .populate('assignedTo', 'name');

        console.log(`✅ Tasks in your organization: ${tasksInOrg.length}`);

        if (tasksInOrg.length > 0) {
            console.log('\nTasks:');
            tasksInOrg.forEach(t => {
                console.log(`  - "${t.title}" → ${t.assignedTo?.name || 'Unassigned'}`);
            });
            console.log('\n🎉 SUCCESS! Tasks are now visible to workload analytics!');
            console.log('🔄 Refresh the /analytics/workload page to see them!');
        } else {
            console.log('\n⚠️  Still no tasks in organization.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();
