const mongoose = require('mongoose');
const Project = require('../models/Project');
require('dotenv').config();

const addMember = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const projectId = '697c8b704780bee36eff4a07';
        const userId = '69627945b0bbe0d552191bfb'; // manager user ID

        const project = await Project.findById(projectId);
        if (!project) {
            console.log('Project not found');
            return;
        }

        if (project.teamMembers.includes(userId)) {
            console.log('User is already a member');
        } else {
            project.teamMembers.push(userId);
            await project.save();
            console.log('User added to project team members');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

addMember();
