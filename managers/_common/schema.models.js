/**
 * Common validation models for School Management API
 */
module.exports = {
    id: {
        path: "id",
        type: "string",
        length: { min: 1, max: 50 },
    },
    username: {
        path: 'username',
        type: 'string',
        length: { min: 3, max: 20 },
        custom: 'username',
    },
    password: {
        path: 'password',
        type: 'string',
        length: { min: 8, max: 100 },
    },
    email: {
        type: 'String',
        regex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    name: {
        path: 'name',
        type: 'string',
        length: { min: 2, max: 200 },
    },
    text: {
        type: 'String',
        length: { min: 1, max: 100 },
    },
    longText: {
        type: 'String',
        length: { min: 1, max: 500 },
    },
    phone: {
        type: 'String',
        length: { min: 7, max: 20 },
    },
    number: {
        type: 'Number',
    },
    bool: {
        type: 'Boolean',
    },
    objectId: {
        type: 'string',
        length: { min: 24, max: 24 },
    },
};