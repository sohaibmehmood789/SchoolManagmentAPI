const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom'
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    grade: {
        type: String,
        trim: true
    },
    guardian: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { 
            type: String, 
            trim: true, 
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
        },
        address: { type: String, trim: true }
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'USA' }
    },
    status: {
        type: String,
        enum: ['enrolled', 'transferred', 'graduated', 'withdrawn', 'suspended'],
        default: 'enrolled'
    },
    previousSchools: [{
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
        schoolName: { type: String },
        enrollmentDate: { type: Date },
        transferDate: { type: Date },
        reason: { type: String }
    }],
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

// Indexes for faster queries
StudentSchema.index({ schoolId: 1 });
StudentSchema.index({ classroomId: 1 });
StudentSchema.index({ studentId: 1 }, { unique: true, sparse: true });
StudentSchema.index({ lastName: 1, firstName: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ isActive: 1 });

// Virtual for full name
StudentSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
StudentSchema.set('toJSON', { virtuals: true });
StudentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', StudentSchema);
