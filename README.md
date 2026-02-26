# School Management System API

A RESTful API for managing schools, classrooms, and students with role-based access control.

## Features

- **Authentication**: JWT-based authentication with secure token management
- **Role-Based Access Control (RBAC)**:
  - Superadmin: Full system access
  - School Admin: School-specific access
- **School Management**: Complete CRUD operations (Superadmin only)
- **Classroom Management**: School-scoped classroom operations
- **Student Management**: Enrollment, transfers, and profile management
- **Security**: Helmet, rate limiting, CORS, input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, express-rate-limit, bcrypt

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- Redis >= 7.x

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd SchoolManagmentAPI
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB and Redis**
```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

5. **Run the application**
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICE_NAME` | Service identifier | school-management-api |
| `ENV` | Environment (development/production) | development |
| `USER_PORT` | API server port | 5111 |
| `MONGO_URI` | MongoDB connection string | mongodb://localhost:27017/school_management |
| `REDIS_URI` | Redis connection string | redis://127.0.0.1:6379 |
| `LONG_TOKEN_SECRET` | JWT secret for long tokens | **Required** |
| `SHORT_TOKEN_SECRET` | JWT secret for short tokens | **Required** |
| `NACL_SECRET` | Encryption secret | **Required** |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | 900000 (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | 100 |

## API Documentation

### Base URL
```
http://localhost:5111/api
```

### Authentication

All protected endpoints require a JWT token in the header:
```
token: <your_jwt_token>
```

---

### Auth Endpoints

#### Register User
```http
POST /api/user/register
```
**Body:**
```json
{
  "username": "admin",
  "email": "admin@school.com",
  "password": "securepassword123",
  "role": "school_admin",
  "schoolId": "optional_school_id"
}
```
**Note:** First registered user becomes superadmin automatically.

#### Login
```http
POST /api/user/login
```
**Body:**
```json
{
  "email": "admin@school.com",
  "password": "securepassword123"
}
```
**Response:**
```json
{
  "ok": true,
  "data": {
    "user": { "username": "admin", "email": "admin@school.com", "role": "superadmin" },
    "longToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Profile
```http
GET /api/user/profile
Headers: token: <jwt_token>
```

---

### School Endpoints (Superadmin Only)

#### Create School
```http
POST /api/school/createSchool
Headers: token: <superadmin_token>
```
**Body:**
```json
{
  "name": "Springfield Elementary",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62701",
    "country": "USA"
  },
  "phone": "+1-555-0123",
  "email": "contact@springfield.edu",
  "website": "https://springfield.edu",
  "establishedYear": 1990,
  "schoolType": "elementary",
  "maxStudents": 500
}
```

#### Get All Schools
```http
GET /api/school/getAllSchools
Headers: token: <superadmin_token>
Query: ?page=1&limit=10&isActive=true&schoolType=elementary&search=spring
```

#### Get School
```http
GET /api/school/getSchool
Headers: token: <superadmin_token>
Body: { "schoolId": "school_id_here" }
```

#### Update School
```http
PUT /api/school/updateSchool
Headers: token: <superadmin_token>
```
**Body:**
```json
{
  "schoolId": "school_id_here",
  "name": "Updated School Name",
  "maxStudents": 600,
  "isActive": true
}
```

#### Delete School
```http
DELETE /api/school/deleteSchool
Headers: token: <superadmin_token>
Body: { "schoolId": "school_id_here" }
```

---

### Classroom Endpoints (School Admin + Superadmin)

#### Create Classroom
```http
POST /api/classroom/createClassroom
Headers: token: <token>
```
**Body:**
```json
{
  "name": "Room 101",
  "schoolId": "school_id (required for superadmin)",
  "grade": "5th",
  "section": "A",
  "capacity": 30,
  "roomNumber": "101",
  "floor": 1,
  "resources": [
    { "name": "Projector", "quantity": 1, "condition": "excellent" }
  ],
  "schedule": {
    "startTime": "08:00",
    "endTime": "15:00"
  }
}
```

#### Get Classrooms
```http
GET /api/classroom/getClassrooms
Headers: token: <token>
Query: ?page=1&limit=10&schoolId=xxx&isActive=true&grade=5th&search=room
```

#### Get Classroom
```http
GET /api/classroom/getClassroom
Headers: token: <token>
Body: { "classroomId": "classroom_id_here" }
```

#### Update Classroom
```http
PUT /api/classroom/updateClassroom
Headers: token: <token>
```
**Body:**
```json
{
  "classroomId": "classroom_id_here",
  "name": "Room 102",
  "capacity": 35,
  "isActive": true
}
```

#### Delete Classroom
```http
DELETE /api/classroom/deleteClassroom
Headers: token: <token>
Body: { "classroomId": "classroom_id_here" }
```

---

### Student Endpoints (School Admin + Superadmin)

#### Create Student
```http
POST /api/student/createStudent
Headers: token: <token>
```
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@student.edu",
  "dateOfBirth": "2015-05-15",
  "gender": "male",
  "schoolId": "school_id (required for superadmin)",
  "classroomId": "optional_classroom_id",
  "grade": "5th",
  "guardian": {
    "name": "Jane Doe",
    "relationship": "Mother",
    "phone": "+1-555-0124",
    "email": "jane.doe@email.com"
  },
  "address": {
    "street": "456 Oak Ave",
    "city": "Springfield",
    "state": "IL",
    "zipCode": "62702"
  }
}
```

#### Get Students
```http
GET /api/student/getStudents
Headers: token: <token>
Query: ?page=1&limit=10&schoolId=xxx&classroomId=xxx&status=enrolled&grade=5th&search=john
```

#### Get Student
```http
GET /api/student/getStudent
Headers: token: <token>
Body: { "studentId": "student_id_here" }
```

#### Update Student
```http
PUT /api/student/updateStudent
Headers: token: <token>
```
**Body:**
```json
{
  "studentId": "student_id_here",
  "firstName": "Johnny",
  "grade": "6th",
  "status": "enrolled"
}
```

#### Delete Student
```http
DELETE /api/student/deleteStudent
Headers: token: <token>
Body: { "studentId": "student_id_here" }
```

#### Transfer Student (Superadmin Only)
```http
POST /api/student/transferStudent
Headers: token: <superadmin_token>
```
**Body:**
```json
{
  "studentId": "student_id_here",
  "toSchoolId": "destination_school_id",
  "reason": "Family relocation"
}
```

#### Enroll in Classroom
```http
POST /api/student/enrollInClassroom
Headers: token: <token>
```
**Body:**
```json
{
  "studentId": "student_id_here",
  "classroomId": "classroom_id_here"
}
```

---

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "ok": true,
  "message": "School Management API is running",
  "timestamp": "2026-02-26T12:00:00.000Z",
  "environment": "development"
}
```

---

## Error Handling

All errors follow a consistent format:
```json
{
  "ok": false,
  "errors": "Error message here",
  "data": {}
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Database Schema

### User
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: 'superadmin' | 'school_admin',
  schoolId: ObjectId (ref: School),
  isActive: Boolean,
  key: String (for token validation)
}
```

### School
```javascript
{
  name: String,
  address: { street, city, state, zipCode, country },
  phone: String,
  email: String,
  website: String,
  establishedYear: Number,
  schoolType: 'elementary' | 'middle' | 'high' | 'k-12' | 'college' | 'university' | 'other',
  isActive: Boolean,
  maxStudents: Number,
  currentStudentCount: Number,
  createdBy: ObjectId (ref: User)
}
```

### Classroom
```javascript
{
  name: String,
  schoolId: ObjectId (ref: School),
  grade: String,
  section: String,
  capacity: Number,
  currentStudentCount: Number,
  roomNumber: String,
  floor: Number,
  resources: [{ name, quantity, condition }],
  schedule: { startTime, endTime },
  isActive: Boolean,
  createdBy: ObjectId (ref: User)
}
```

### Student
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  dateOfBirth: Date,
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say',
  studentId: String (auto-generated, unique),
  schoolId: ObjectId (ref: School),
  classroomId: ObjectId (ref: Classroom),
  enrollmentDate: Date,
  grade: String,
  guardian: { name, relationship, phone, email, address },
  address: { street, city, state, zipCode, country },
  status: 'enrolled' | 'transferred' | 'graduated' | 'withdrawn' | 'suspended',
  previousSchools: [{ schoolId, schoolName, enrollmentDate, transferDate, reason }],
  isActive: Boolean,
  createdBy: ObjectId (ref: User)
}
```

---

## Project Structure

```
SchoolManagmentAPI/
├── app.js                 # App initialization
├── index.js              # Entry point
├── package.json
├── .env                  # Environment variables
├── cache/                # Redis cache handlers
├── config/               # Configuration files
│   ├── index.config.js
│   └── envs/
├── connect/              # Database connections
│   └── mongo.js
├── libs/                 # Utility libraries
│   └── utils.js
├── loaders/              # Module loaders
│   ├── ManagersLoader.js
│   ├── MiddlewaresLoader.js
│   ├── MongoLoader.js
│   └── ValidatorsLoader.js
├── managers/             # Business logic
│   ├── api/              # API handler
│   ├── entities/         # Entity managers
│   │   ├── classroom/
│   │   ├── school/
│   │   ├── student/
│   │   └── user/
│   ├── http/             # HTTP server
│   ├── response_dispatcher/
│   ├── token/            # JWT management
│   └── virtual_stack/    # Middleware execution
├── mws/                  # Middlewares
│   ├── __auth.mw.js
│   ├── __superadmin.mw.js
│   ├── __schoolAdmin.mw.js
│   └── ...
├── public/               # Static files
└── tests/                # Test files
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

---

## Security Features

1. **Helmet**: Sets secure HTTP headers
2. **Rate Limiting**: 100 requests/15 min (general), 20 requests/15 min (auth)
3. **CORS**: Configurable origins
4. **Password Hashing**: bcrypt with salt rounds
5. **JWT Tokens**: Secure token-based authentication
6. **Input Validation**: Schema-based validation
7. **Role-Based Access**: Superadmin and School Admin roles

---

## Deployment

### Docker (Recommended)

```bash
# Build
docker build -t school-management-api .

# Run
docker run -p 5111:5111 --env-file .env school-management-api
```

### Manual Deployment

1. Set `ENV=production` in environment
2. Configure production MongoDB and Redis
3. Set secure secrets for tokens
4. Run with PM2 or similar process manager:
```bash
pm2 start index.js --name school-api
```
