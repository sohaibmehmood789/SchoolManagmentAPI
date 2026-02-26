/**
 * Test Configuration
 */
module.exports = {
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:5111',

    // Test user credentials
    superadmin: {
        username: 'testsuperadmin',
        email: 'superadmin@test.com',
        password: 'TestPassword123!'
    },

    schoolAdmin: {
        username: 'testschooladmin',
        email: 'schooladmin@test.com',
        password: 'TestPassword123!'
    },

    // Test data
    testSchool: {
        name: 'Test School ' + Date.now(),
        address: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA'
        },
        phone: '+1-555-0000',
        email: 'test@testschool.edu',
        schoolType: 'k-12',
        maxStudents: 100
    },

    testClassroom: {
        name: 'Test Classroom ' + Date.now(),
        grade: '5th',
        section: 'A',
        capacity: 30,
        roomNumber: 'T101',
        floor: 1
    },

    testStudent: {
        firstName: 'Test',
        lastName: 'Student',
        email: 'teststudent' + Date.now() + '@test.com',
        gender: 'other',
        grade: '5th'
    }
};
