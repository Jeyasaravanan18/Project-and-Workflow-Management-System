const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AuditLog = require('../models/AuditLog');

const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAuditLogs() {
    try {
        console.log('🔍 Connecting to MongoDB...');
        console.log('🔗 URI:', process.env.MONGODB_URI ? 'FOUND (Length: ' + process.env.MONGODB_URI.length + ')' : 'NOT FOUND');
        if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined in .env');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(5).populate('userId', 'name email');
        
        if (logs.length === 0) {
            console.log('ℹ️ No audit logs found yet. Perform a change in the UI or API and try again.');
        } else {
            console.log(`✅ Found ${logs.length} audit logs:`);
            logs.forEach((log, i) => {
                console.log(`\n[${i+1}] ${log.timestamp.toISOString()}`);
                console.log(`    Action: ${log.action}`);
                console.log(`    Resource: ${log.resourceType} (${log.resourceId})`);
                console.log(`    User: ${log.userId?.name || 'Unknown'} (${log.userId?.email || 'N/A'})`);
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

verifyAuditLogs();
