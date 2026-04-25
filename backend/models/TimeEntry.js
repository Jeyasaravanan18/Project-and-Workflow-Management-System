const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // In seconds
        default: 0
    },
    description: {
        type: String,
        trim: true
    },
    billable: {
        type: Boolean,
        default: true
    },
    isManual: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for finding active timer
timeEntrySchema.index({ userId: 1, endTime: 1 }); // endTime is null for active

// Pre-save hook to calculate duration
timeEntrySchema.pre('save', function (next) {
    if (this.endTime && this.startTime) {
        this.duration = Math.round((this.endTime - this.startTime) / 1000);
    }
    next();
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
