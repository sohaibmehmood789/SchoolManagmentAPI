module.exports = {
    register: [
        {
            model: 'username',
            required: true,
        },
        {
            model: 'email',
            required: true,
        },
        {
            model: 'password',
            required: true,
        },
        {
            path: 'role',
            type: 'string',
            oneOf: ['superadmin', 'school_admin'],
            required: false,
        },
        {
            path: 'schoolId',
            type: 'string',
            length: { min: 24, max: 24 },
            required: false,
        },
    ],
    login: [
        {
            model: 'email',
            required: true,
        },
        {
            model: 'password',
            required: true,
        },
    ],
}


