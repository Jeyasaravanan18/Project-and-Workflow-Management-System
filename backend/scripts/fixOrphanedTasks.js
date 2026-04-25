const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const targetOrgId = new mongoose.Types.ObjectId('6962770c19533f153c6bdd77');

        console.log(`Setting organization ID to: ${targetOrgId}\n`);

        // Use native MongoDB driver
        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        const result = await tasksCollection.updateMany(
            {
                $or: [
                    { organizationId: null },
                    { organizationId: { $exists: false } }
                ]
            },
            {
                $set: { organizationId: targetOrgId }
            }
        );

        console.log(`✅ Matched: ${result.matchedCount} tasks`);
        console.log(`✅ Modified: ${result.modifiedCount} tasks`);

        // Verify
        const count = await tasksCollection.countDocuments({ organizationId: targetOrgId });
        console.log(`\n📊 Tasks in organization now: ${count}`);

        if (count > 0) {
            console.log('\n🎉 SUCCESS! Refresh /analytics/workload now!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
