const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
// Define the model directly to avoid dependency issues if the file import fails
// Or try to import if confident. Let's try to import first but wrap it well.

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Lazy load model to see if that's the issue
        const User = require('../models/User');

        const email = 'admin@example.com';
        console.log(`Finding user with email: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('User not found in DB.');
            process.exit(1);
        }

        console.log(`Current role: ${user.role}`);
        user.role = 'admin';
        await user.save();
        console.log(`Updated user ${user.email} to role ${user.role}`);

        process.exit(0);
    } catch (error) {
        console.error('FATAL ERROR:');
        console.error(error);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
};

run();
