/**
 * School Management API - Integration Tests
 *
 * Run with: npm test
 *
 * Prerequisites:
 * - Server running on port 5111
 * - MongoDB connected
 * - Redis connected
 */

const http = require('http');
const config = require('./config');

// Test state
let superadminToken = null;
let schoolAdminToken = null;
let createdSchoolId = null;
let createdClassroomId = null;
let createdStudentId = null;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, config.baseUrl);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['token'] = token;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test runner
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    console.log('\n🧪 School Management API Tests\n');
    console.log('='.repeat(50));

    for (const t of tests) {
        try {
            await t.fn();
            console.log(`✅ ${t.name}`);
            passed++;
        } catch (error) {
            console.log(`❌ ${t.name}`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50) + '\n');

    process.exit(failed > 0 ? 1 : 0);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// ==================== TESTS ====================

// Health Check
test('Health check endpoint returns ok', async () => {
    const res = await makeRequest('GET', '/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.ok === true, 'Expected ok to be true');
});

// Auth Tests
test('Register superadmin (first user)', async () => {
    const res = await makeRequest('POST', '/api/user/register', config.superadmin);
    // First user becomes superadmin OR user already exists
    if (res.body.ok) {
        assert(res.body.data.longToken, 'Expected token in response');
        superadminToken = res.body.data.longToken;
    } else {
        // User might already exist, try login
        const loginRes = await makeRequest('POST', '/api/user/login', {
            email: config.superadmin.email,
            password: config.superadmin.password
        });
        assert(loginRes.body.ok === true, 'Login should succeed');
        superadminToken = loginRes.body.data.longToken;
    }
});

test('Login as superadmin', async () => {
    const res = await makeRequest('POST', '/api/user/login', {
        email: config.superadmin.email,
        password: config.superadmin.password
    });
    assert(res.body.ok === true, 'Login should succeed');
    assert(res.body.data.longToken, 'Expected token');
    assert(res.body.data.user.role === 'superadmin', 'Expected superadmin role');
    superadminToken = res.body.data.longToken;
});

test('Get profile with valid token', async () => {
    const res = await makeRequest('GET', '/api/user/profile', null, superadminToken);
    assert(res.body.ok === true, 'Should get profile');
    assert(res.body.data.user, 'Expected user data');
});

test('Reject request without token', async () => {
    const res = await makeRequest('GET', '/api/user/profile');
    assert(res.body.ok === false, 'Should reject without token');
    assert(res.status === 401, 'Expected 401 status');
});

test('Reject invalid token', async () => {
    const res = await makeRequest('GET', '/api/user/profile', null, 'invalid_token');
    assert(res.body.ok === false, 'Should reject invalid token');
});

// School Tests
test('Create school (superadmin)', async () => {
    const res = await makeRequest('POST', '/api/school/createSchool', config.testSchool, superadminToken);
    assert(res.body.ok === true, `School creation failed: ${JSON.stringify(res.body.errors)}`);
    assert(res.body.data.school, 'Expected school in response');
    assert(res.body.data.school._id, 'Expected school ID');
    createdSchoolId = res.body.data.school._id;
});

test('Get all schools', async () => {
    const res = await makeRequest('GET', '/api/school/getAllSchools', null, superadminToken);
    assert(res.body.ok === true, 'Should get schools');
    assert(Array.isArray(res.body.data.schools), 'Expected schools array');
    assert(res.body.data.pagination, 'Expected pagination');
});

test('Get single school', async () => {
    const res = await makeRequest('GET', '/api/school/getSchool', { schoolId: createdSchoolId }, superadminToken);
    assert(res.body.ok === true, 'Should get school');
    assert(res.body.data.school._id === createdSchoolId, 'School ID should match');
});

test('Update school', async () => {
    const res = await makeRequest('PUT', '/api/school/updateSchool', {
        schoolId: createdSchoolId,
        maxStudents: 200
    }, superadminToken);
    assert(res.body.ok === true, 'Should update school');
    assert(res.body.data.school.maxStudents === 200, 'maxStudents should be updated');
});

// Classroom Tests
test('Create classroom', async () => {
    const res = await makeRequest('POST', '/api/classroom/createClassroom', {
        ...config.testClassroom,
        schoolId: createdSchoolId
    }, superadminToken);
    assert(res.body.ok === true, `Classroom creation failed: ${JSON.stringify(res.body.errors)}`);
    assert(res.body.data.classroom, 'Expected classroom in response');
    createdClassroomId = res.body.data.classroom._id;
});

test('Get classrooms', async () => {
    const res = await makeRequest('GET', '/api/classroom/getClassrooms', { schoolId: createdSchoolId }, superadminToken);
    assert(res.body.ok === true, 'Should get classrooms');
    assert(Array.isArray(res.body.data.classrooms), 'Expected classrooms array');
});

test('Get single classroom', async () => {
    const res = await makeRequest('GET', '/api/classroom/getClassroom', { classroomId: createdClassroomId }, superadminToken);
    assert(res.body.ok === true, 'Should get classroom');
    assert(res.body.data.classroom._id === createdClassroomId, 'Classroom ID should match');
});

test('Update classroom', async () => {
    const res = await makeRequest('PUT', '/api/classroom/updateClassroom', {
        classroomId: createdClassroomId,
        capacity: 35
    }, superadminToken);
    assert(res.body.ok === true, 'Should update classroom');
    assert(res.body.data.classroom.capacity === 35, 'Capacity should be updated');
});

// Student Tests
test('Create student', async () => {
    const res = await makeRequest('POST', '/api/student/createStudent', {
        ...config.testStudent,
        schoolId: createdSchoolId
    }, superadminToken);
    assert(res.body.ok === true, `Student creation failed: ${JSON.stringify(res.body.errors)}`);
    assert(res.body.data.student, 'Expected student in response');
    assert(res.body.data.student.studentId, 'Expected auto-generated studentId');
    createdStudentId = res.body.data.student._id;
});

test('Get students', async () => {
    const res = await makeRequest('GET', '/api/student/getStudents', { schoolId: createdSchoolId }, superadminToken);
    assert(res.body.ok === true, 'Should get students');
    assert(Array.isArray(res.body.data.students), 'Expected students array');
});

test('Get single student', async () => {
    const res = await makeRequest('GET', '/api/student/getStudent', { studentId: createdStudentId }, superadminToken);
    assert(res.body.ok === true, 'Should get student');
    assert(res.body.data.student._id === createdStudentId, 'Student ID should match');
});

test('Update student', async () => {
    const res = await makeRequest('PUT', '/api/student/updateStudent', {
        studentId: createdStudentId,
        grade: '6th'
    }, superadminToken);
    assert(res.body.ok === true, 'Should update student');
    assert(res.body.data.student.grade === '6th', 'Grade should be updated');
});

test('Enroll student in classroom', async () => {
    const res = await makeRequest('POST', '/api/student/enrollInClassroom', {
        studentId: createdStudentId,
        classroomId: createdClassroomId
    }, superadminToken);
    assert(res.body.ok === true, 'Should enroll student');
});

// Cleanup Tests (run last)
test('Delete student', async () => {
    const res = await makeRequest('DELETE', '/api/student/deleteStudent', { studentId: createdStudentId }, superadminToken);
    assert(res.body.ok === true, 'Should delete student');
});

test('Delete classroom', async () => {
    const res = await makeRequest('DELETE', '/api/classroom/deleteClassroom', { classroomId: createdClassroomId }, superadminToken);
    assert(res.body.ok === true, 'Should delete classroom');
});

test('Delete school', async () => {
    const res = await makeRequest('DELETE', '/api/school/deleteSchool', { schoolId: createdSchoolId }, superadminToken);
    assert(res.body.ok === true, 'Should delete school');
});

// 404 Test
test('Return 404 for unknown endpoint', async () => {
    const res = await makeRequest('GET', '/api/unknown/endpoint');
    assert(res.status === 404, 'Expected 404 status');
    assert(res.body.ok === false, 'Expected ok to be false');
});

// Run all tests
runTests().catch(console.error);
