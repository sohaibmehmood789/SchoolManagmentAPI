const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    address: {
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        zipCode: { type: String, trim: true },
        country: { type: String, trim: true, default: 'USA' }
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    website: {
        type: String,
        trim: true
    },
    establishedYear: {
        type: Number
    },
    schoolType: {
        type: String,
        enum: ['elementary', 'middle', 'high', 'k-12', 'college', 'university', 'other'],
        default: 'k-12'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    maxStudents: {
        type: Number,
        default: 1000
    },
    currentStudentCount: {
        type: Number,
        default: 0
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

// Index for faster queries
SchoolSchema.index({ name: 1 });
SchoolSchema.index({ 'address.city': 1 });
SchoolSchema.index({ isActive: 1 });

module.exports = mongoose.model('School', SchoolSchema);
