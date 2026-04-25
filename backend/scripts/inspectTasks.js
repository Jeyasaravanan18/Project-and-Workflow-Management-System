const mongoose = require('mongoose');
const Task = require('../models/Task');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const allTasks = await Task.find({}).limit(3);

        console.log(`Total tasks in DB: ${await Task.countDocuments({})}`);
        console.log(`\nFirst 3 tasks structure:\n`);

        allTasks.forEach((t, i) => {
            console.log(`Task ${i + 1}:`);
            console.log(`  _id: ${t._id}`);
            console.log(`  title: ${t.title}`);
            console.log(`  organizationId: ${t.organizationId || 'MISSING'}`);
            console.log(`  assignedTo: ${t.assignedTo || 'MISSING'}`);
            console.log(`  completedAt: ${t.completedAt || 'null (active)'}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
