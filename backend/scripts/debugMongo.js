const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const tasksCollection = db.collection('tasks');

        // Get ALL tasks with their organizationId
        const allTasks = await tasksCollection.find({}).project({ title: 1, organizationId: 1 }).toArray();

        console.log(`Total tasks: ${allTasks.length}\n`);

        allTasks.forEach((t, i) => {
            console.log(`${i + 1}. "${t.title}"`);
            console.log(`   orgId: ${t.organizationId || 'NULL'}\n`);
        });

        // Now try to update
        const targetOrgId = new mongoose.Types.ObjectId('6962770c19533f153c6bdd77');
        console.log(`\nAttempting to set orgId to: ${targetOrgId}`);

        const updateResult = await tasksCollection.updateMany(
            { organizationId: { $exists: false } },
            { $set: { organizationId: targetOrgId } }
        );

        console.log(`\nUpdate result:`);
        console.log(`  Matched: ${updateResult.matchedCount}`);
        console.log(`  Modified: ${updateResult.modifiedCount}`);

        // Verify again
        const afterUpdate = await tasksCollection.find({}).project({ title: 1, organizationId: 1 }).limit(3).toArray();
        console.log(`\nAfter update (first 3):`);
        afterUpdate.forEach(t => {
            console.log(`  "${t.title}" → orgId: ${t.organizationId || 'NULL'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
