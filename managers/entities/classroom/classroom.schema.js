module.exports = {
    createClassroom: [
        {
            path: 'name',
            type: 'string',
            length: { min: 1, max: 100 },
            required: true,
        },
        {
            path: 'schoolId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: false, // Optional for school admins (uses their assigned school)
        },
        {
            path: 'grade',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'section',
            type: 'string',
            length: { min: 1, max: 10 },
            required: false,
        },
        {
            path: 'capacity',
            type: 'number',
            required: false,
        },
        {
            path: 'roomNumber',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'floor',
            type: 'number',
            required: false,
        },
    ],
    updateClassroom: [
        {
            path: 'classroomId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: true,
        },
        {
            path: 'name',
            type: 'string',
            length: { min: 1, max: 100 },
            required: false,
        },
        {
            path: 'grade',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'section',
            type: 'string',
            length: { min: 1, max: 10 },
            required: false,
        },
        {
            path: 'capacity',
            type: 'number',
            required: false,
        },
        {
            path: 'roomNumber',
            type: 'string',
            length: { min: 1, max: 20 },
            required: false,
        },
        {
            path: 'floor',
            type: 'number',
            required: false,
        },
        {
            path: 'isActive',
            type: 'boolean',
            required: false,
        },
    ],
};
