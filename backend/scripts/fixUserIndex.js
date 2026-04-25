const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        const emailIndex = indexes.find(i => i.key.email === 1 && i.unique === true);

        if (emailIndex) {
            console.log(`Found old unique email index: ${emailIndex.name}. Dropping...`);
            await collection.dropIndex(emailIndex.name);
            console.log('✅ Old index dropped');
        } else {
            console.log('ℹ️ No old unique email index found (or already dropped)');
        }

        // Mongoose will recreate the indexes based on the schema when the app starts, 
        // or we can trigger it here:
        console.log('Syncing indexes from schema...');
        await User.syncIndexes();
        console.log('✅ Indexes synced');

        const newIndexes = await collection.indexes();
        console.log('New indexes:', newIndexes.map(i => i.name));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
        process.exit(1);
    }
};

fixIndexes();
