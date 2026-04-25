const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const { scaffoldProject } = require('../controllers/projectController');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) throw new Error('No admin user found for testing.');

        // Find or create a dummy project
        let project = await Project.findOne({ name: 'Test Scaffold Project' });
        if (!project) {
            project = await Project.create({
                name: 'Test Scaffold Project',
                description: 'A test project',
                organizationId: adminUser.organizationId,
                managerId: adminUser._id,
                targetEndDate: new Date()
            });

            // Need workflow stages to succeed
            const WorkflowStage = require('./models/WorkflowStage');
            await WorkflowStage.insertMany([
                { name: 'To Do', type: 'todo', order: 1, projectId: project._id },
                { name: 'Done', type: 'done', order: 2, isCompleteStage: true, projectId: project._id }
            ]);
            console.log('Created test project & stages:', project._id);
        }

        console.log('Testing scaffold on project:', project._id);

        const req = {
            body: {
                description: 'Build a simple blog with a homepage, post details, and an admin panel to write posts.'
            },
            params: {
                id: project._id.toString()
            },
            user: adminUser
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                console.log('Status:', this.statusCode);
                console.log('Response:', JSON.stringify(data, null, 2));
                return data;
            }
        };

        await scaffoldProject(req, res);

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

test();
