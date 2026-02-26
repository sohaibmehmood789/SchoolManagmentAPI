module.exports = {
    createSchool: [
        {
            path: 'name',
            type: 'string',
            length: { min: 2, max: 200 },
            required: true,
        },
        {
            path: 'address',
            type: 'object',
            required: false,
        },
        {
            path: 'phone',
            type: 'string',
            length: { min: 5, max: 20 },
            required: false,
        },
        {
            path: 'email',
            type: 'string',
            length: { min: 5, max: 100 },
            required: false,
        },
        {
            path: 'website',
            type: 'string',
            length: { min: 5, max: 200 },
            required: false,
        },
        {
            path: 'establishedYear',
            type: 'number',
            required: false,
        },
        {
            path: 'schoolType',
            type: 'string',
            oneOf: ['elementary', 'middle', 'high', 'k-12', 'college', 'university', 'other'],
            required: false,
        },
        {
            path: 'maxStudents',
            type: 'number',
            required: false,
        },
    ],
    updateSchool: [
        {
            path: 'schoolId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: true,
        },
        {
            path: 'name',
            type: 'string',
            length: { min: 2, max: 200 },
            required: false,
        },
        {
            path: 'address',
            type: 'object',
            required: false,
        },
        {
            path: 'phone',
            type: 'string',
            length: { min: 5, max: 20 },
            required: false,
        },
        {
            path: 'email',
            type: 'string',
            length: { min: 5, max: 100 },
            required: false,
        },
        {
            path: 'website',
            type: 'string',
            length: { min: 5, max: 200 },
            required: false,
        },
        {
            path: 'establishedYear',
            type: 'number',
            required: false,
        },
        {
            path: 'schoolType',
            type: 'string',
            oneOf: ['elementary', 'middle', 'high', 'k-12', 'college', 'university', 'other'],
            required: false,
        },
        {
            path: 'maxStudents',
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
