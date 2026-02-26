module.exports = {
    createStudent: [
        {
            path: 'firstName',
            type: 'string',
            length: { min: 1, max: 100 },
            required: true,
        },
        {
            path: 'lastName',
            type: 'string',
            length: { min: 1, max: 100 },
            required: true,
        },
        {
            model: 'email',
            required: false,
        },
        {
            path: 'schoolId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: false, // Optional for school admins
        },
        {
            path: 'classroomId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: false,
        },
        {
            path: 'grade',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'gender',
            type: 'string',
            oneOf: ['male', 'female', 'other', 'prefer_not_to_say'],
            required: false,
        },
    ],
    updateStudent: [
        {
            path: 'studentId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: true,
        },
        {
            path: 'firstName',
            type: 'string',
            length: { min: 1, max: 100 },
            required: false,
        },
        {
            path: 'lastName',
            type: 'string',
            length: { min: 1, max: 100 },
            required: false,
        },
        {
            model: 'email',
            required: false,
        },
        {
            path: 'grade',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'gender',
            type: 'string',
            oneOf: ['male', 'female', 'other', 'prefer_not_to_say'],
            required: false,
        },
        {
            path: 'status',
            type: 'string',
            oneOf: ['enrolled', 'transferred', 'graduated', 'withdrawn', 'suspended'],
            required: false,
        },
        {
            path: 'isActive',
            type: 'boolean',
            required: false,
        },
    ],
};
