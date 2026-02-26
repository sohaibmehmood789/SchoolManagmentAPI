const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    grade: {
        type: String,
        trim: true
    },
    section: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 200,
        default: 30
    },
    currentStudentCount: {
        type: Number,
        default: 0
    },
    roomNumber: {
        type: String,
        trim: true
    },
    floor: {
        type: Number
    },
    resources: [{
        name: { type: String, trim: true },
        quantity: { type: Number, default: 1 },
        condition: { 
            type: String, 
            enum: ['excellent', 'good', 'fair', 'poor'],
            default: 'good'
        }
    }],
    schedule: {
        startTime: { type: String },
        endTime: { type: String }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for unique classroom per school
ClassroomSchema.index({ schoolId: 1, name: 1 }, { unique: true });
ClassroomSchema.index({ schoolId: 1 });
ClassroomSchema.index({ isActive: 1 });

// Virtual for available capacity
ClassroomSchema.virtual('availableCapacity').get(function() {
    return this.capacity - this.currentStudentCount;
});

// Ensure virtuals are included in JSON output
ClassroomSchema.set('toJSON', { virtuals: true });
ClassroomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Classroom', ClassroomSchema);
