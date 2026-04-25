const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
require('dotenv').config();

/**
 * Backfill organizationId for existing activity logs
 * This script updates all ActivityLog records that are missing organizationId
 * by looking up the user's organization.
 */
const backfillActivityOrganizations = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all activities without organizationId
        const activitiesWithoutOrg = await ActivityLog.find({
            organizationId: { $exists: false }
        }).select('_id userId');

        console.log(`Found ${activitiesWithoutOrg.length} activities without organizationId`);

        if (activitiesWithoutOrg.length === 0) {
            console.log('No activities to update. Exiting.');
            process.exit(0);
        }

        let updated = 0;
        let failed = 0;

        for (const activity of activitiesWithoutOrg) {
            try {
                // Look up the user to get their organizationId
                const user = await User.findById(activity.userId).select('organizationId');

                if (user && user.organizationId) {
                    await ActivityLog.updateOne(
                        { _id: activity._id },
                        { $set: { organizationId: user.organizationId } }
                    );
                    updated++;
                } else {
                    console.warn(`No organization found for user ${activity.userId}`);
                    failed++;
                }
            } catch (err) {
                console.error(`Error updating activity ${activity._id}:`, err.message);
                failed++;
            }
        }

        console.log('\n=== Backfill Complete ===');
        console.log(`Successfully updated: ${updated}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${activitiesWithoutOrg.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error in backfill script:', error);
        process.exit(1);
    }
};

// Run the script
backfillActivityOrganizations();
