const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const fs = require('fs');
require('dotenv').config();

const inspectProject = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let output = '';
        output += 'Connected to MongoDB\n';

        const projects = await Project.find({}).populate('managerId', 'name email role').populate('teamMembers', 'name email role');
        output += `Found ${projects.length} projects\n`;

        for (const p of projects) {
            output += `Project: ${p.name} (ID: ${p._id})\n`;
            output += `  Manager: ${p.managerId?.name} (${p.managerId?.role}) [ID: ${p.managerId?._id}]\n`;
            output += `  Members (${p.teamMembers.length}):\n`;
            p.teamMembers.forEach(m => {
                output += `    - ${m.name} (${m.email}) (${m.role}) [ID: ${m._id}]\n`;
            });
            output += '\n';
        }

        const allUsers = await User.find({}, 'name email role onlineStatus lastActive');
        output += '\nAll Users:\n';
        allUsers.forEach(u => {
            output += `- ${u.name} (${u.email}) role: ${u.role}, status: ${u.onlineStatus} [ID: ${u._id}]\n`;
        });

        fs.writeFileSync('debug_output.txt', output);
        console.log('Output written to debug_output.txt');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectProject();
