const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Global settings for the organization's workflow could go here
    settings: {
        allowMemberTaskCreation: {
            type: Boolean,
            default: false
        },
        defaultWorkDayHours: {
            type: Number,
            default: 8
        }
    }
});

module.exports = mongoose.model('Organization', organizationSchema);
