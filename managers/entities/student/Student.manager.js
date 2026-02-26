const { nanoid } = require('nanoid');

module.exports = class Student {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.httpExposed = [
            'post=createStudent',
            'get=getStudent',
            'get=getStudents',
            'put=updateStudent',
            'delete=deleteStudent',
            'post=transferStudent',
            'post=enrollInClassroom'
        ];
    }

    /**
     * Generate unique student ID
     */
    _generateStudentId(schoolPrefix = 'STU') {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = nanoid(6).toUpperCase();
        return `${schoolPrefix}${year}${random}`;
    }

    /**
     * Create a new student
     * POST /api/student/createStudent
     * Accessible by: school_admin (own school) or superadmin
     */
    async createStudent({
        __schoolAdmin,
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        schoolId,
        classroomId,
        grade,
        guardian,
        address
    }) {
        // For school admins, use their assigned school
        const targetSchoolId = __schoolAdmin.role === 'superadmin' ? schoolId : __schoolAdmin.schoolId;

        if (!targetSchoolId) {
            return { errors: 'School ID is required' };
        }

        const studentData = { firstName, lastName, email, schoolId: targetSchoolId };

        // Validate input
        let validationResult = await this.validators.student.createStudent(studentData);
        if (validationResult) return { errors: validationResult };

        // Verify school exists and is active
        const school = await this.mongomodels.school.findById(targetSchoolId);
        if (!school) {
            return { errors: 'School not found' };
        }
        if (!school.isActive) {
            return { errors: 'Cannot add student to inactive school' };
        }

        // Check school capacity
        if (school.currentStudentCount >= school.maxStudents) {
            return { errors: 'School has reached maximum student capacity' };
        }

        // If classroom is specified, verify it exists and has capacity
        let classroom = null;
        if (classroomId) {
            classroom = await this.mongomodels.classroom.findById(classroomId);
            if (!classroom) {
                return { errors: 'Classroom not found' };
            }
            if (classroom.schoolId.toString() !== targetSchoolId) {
                return { errors: 'Classroom does not belong to the specified school' };
            }
            if (!classroom.isActive) {
                return { errors: 'Cannot enroll student in inactive classroom' };
            }
            if (classroom.currentStudentCount >= classroom.capacity) {
                return { errors: 'Classroom has reached maximum capacity' };
            }
        }

        // Check for duplicate email if provided
        if (email) {
            const existingStudent = await this.mongomodels.student.findOne({
                email,
                schoolId: targetSchoolId,
                isActive: true
            });
            if (existingStudent) {
                return { errors: 'A student with this email already exists in this school' };
            }
        }

        // Generate unique student ID
        const studentIdNum = this._generateStudentId();

        // Create student
        const newStudent = new this.mongomodels.student({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email,
            dateOfBirth,
            gender,
            studentId: studentIdNum,
            schoolId: targetSchoolId,
            classroomId: classroomId || null,
            grade,
            guardian: guardian || {},
            address: address || {},
            status: 'enrolled',
            enrollmentDate: new Date(),
            isActive: true,
            createdBy: __schoolAdmin.userId
        });

        try {
            await newStudent.save();

            // Update school student count
            await this.mongomodels.school.findByIdAndUpdate(targetSchoolId, {
                $inc: { currentStudentCount: 1 }
            });

            // Update classroom student count if enrolled in classroom
            if (classroomId) {
                await this.mongomodels.classroom.findByIdAndUpdate(classroomId, {
                    $inc: { currentStudentCount: 1 }
                });
            }
        } catch (error) {
            console.error('Student creation error:', error);
            if (error.code === 11000) {
                return { errors: 'Student ID or email already exists' };
            }
            return { errors: 'Failed to create student' };
        }

        return {
            student: newStudent
        };
    }

    /**
     * Get a single student by ID
     * GET /api/student/getStudent
     * Accessible by: school_admin (own school) or superadmin
     */
    async getStudent({ __schoolAdmin, studentId }) {
        if (!studentId) {
            return { errors: 'Student ID is required' };
        }

        try {
            const student = await this.mongomodels.student.findById(studentId)
                .populate('schoolId', 'name')
                .populate('classroomId', 'name grade')
                .populate('createdBy', 'username email');

            if (!student) {
                return { errors: 'Student not found' };
            }

            // School admins can only view students in their school
            if (__schoolAdmin.role !== 'superadmin' && student.schoolId._id.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This student belongs to a different school.' };
            }

            return { student };
        } catch (error) {
            console.error('Get student error:', error);
            return { errors: 'Invalid student ID format' };
        }
    }

    /**
     * Get all students (filtered by school for school_admin)
     * GET /api/student/getStudents
     * Accessible by: school_admin (own school) or superadmin
     */
    async getStudents({
        __schoolAdmin,
        schoolId,
        classroomId,
        page = 1,
        limit = 10,
        status,
        grade,
        search
    }) {
        const query = {};

        // School admins can only see their school's students
        if (__schoolAdmin.role === 'superadmin') {
            if (schoolId) {
                query.schoolId = schoolId;
            }
        } else {
            query.schoolId = __schoolAdmin.schoolId;
        }

        // Filter by classroom
        if (classroomId) {
            query.classroomId = classroomId;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by grade
        if (grade) {
            query.grade = grade;
        }

        // Search by name, email, or student ID
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        try {
            const [students, total] = await Promise.all([
                this.mongomodels.student.find(query)
                    .populate('schoolId', 'name')
                    .populate('classroomId', 'name grade')
                    .sort({ lastName: 1, firstName: 1 })
                    .skip(skip)
                    .limit(limitNum),
                this.mongomodels.student.countDocuments(query)
            ]);

            return {
                students,
                pagination: {
                    current: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            };
        } catch (error) {
            console.error('Get students error:', error);
            return { errors: 'Failed to fetch students' };
        }
    }

    /**
     * Update a student
     * PUT /api/student/updateStudent
     * Accessible by: school_admin (own school) or superadmin
     */
    async updateStudent({
        __schoolAdmin,
        studentId,
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        grade,
        guardian,
        address,
        status,
        isActive
    }) {
        if (!studentId) {
            return { errors: 'Student ID is required' };
        }

        const updateData = { studentId, firstName, lastName, email };

        // Validate input
        let validationResult = await this.validators.student.updateStudent(updateData);
        if (validationResult) return { errors: validationResult };

        try {
            const student = await this.mongomodels.student.findById(studentId);

            if (!student) {
                return { errors: 'Student not found' };
            }

            // School admins can only update students in their school
            if (__schoolAdmin.role !== 'superadmin' && student.schoolId.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This student belongs to a different school.' };
            }

            // Check for duplicate email if changing email
            if (email && email !== student.email) {
                const existingStudent = await this.mongomodels.student.findOne({
                    email,
                    schoolId: student.schoolId,
                    _id: { $ne: studentId },
                    isActive: true
                });
                if (existingStudent) {
                    return { errors: 'A student with this email already exists in this school' };
                }
                student.email = email;
            }

            // Update fields
            if (firstName) student.firstName = firstName.trim();
            if (lastName) student.lastName = lastName.trim();
            if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
            if (gender !== undefined) student.gender = gender;
            if (grade !== undefined) student.grade = grade;
            if (guardian !== undefined) student.guardian = guardian;
            if (address !== undefined) student.address = address;
            if (status !== undefined) student.status = status;
            if (isActive !== undefined) student.isActive = isActive;

            student.updatedAt = new Date();

            await student.save();

            return { student };
        } catch (error) {
            console.error('Update student error:', error);
            return { errors: 'Failed to update student' };
        }
    }

    /**
     * Delete a student
     * DELETE /api/student/deleteStudent
     * Accessible by: school_admin (own school) or superadmin
     */
    async deleteStudent({ __schoolAdmin, studentId }) {
        if (!studentId) {
            return { errors: 'Student ID is required' };
        }

        try {
            const student = await this.mongomodels.student.findById(studentId);

            if (!student) {
                return { errors: 'Student not found' };
            }

            // School admins can only delete students in their school
            if (__schoolAdmin.role !== 'superadmin' && student.schoolId.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This student belongs to a different school.' };
            }

            const schoolId = student.schoolId;
            const classroomId = student.classroomId;

            await this.mongomodels.student.findByIdAndDelete(studentId);

            // Update school student count
            await this.mongomodels.school.findByIdAndUpdate(schoolId, {
                $inc: { currentStudentCount: -1 }
            });

            // Update classroom student count if was enrolled
            if (classroomId) {
                await this.mongomodels.classroom.findByIdAndUpdate(classroomId, {
                    $inc: { currentStudentCount: -1 }
                });
            }

            return {
                message: 'Student deleted successfully',
                deletedStudent: {
                    id: student._id,
                    name: `${student.firstName} ${student.lastName}`,
                    studentId: student.studentId
                }
            };
        } catch (error) {
            console.error('Delete student error:', error);
            return { errors: 'Failed to delete student' };
        }
    }

    /**
     * Transfer a student to another school
     * POST /api/student/transferStudent
     * Accessible by: superadmin only
     */
    async transferStudent({ __superadmin, studentId, toSchoolId, reason }) {
        if (!studentId || !toSchoolId) {
            return { errors: 'Student ID and destination school ID are required' };
        }

        try {
            const student = await this.mongomodels.student.findById(studentId);
            if (!student) {
                return { errors: 'Student not found' };
            }

            if (student.schoolId.toString() === toSchoolId) {
                return { errors: 'Student is already in this school' };
            }

            // Verify destination school exists and is active
            const toSchool = await this.mongomodels.school.findById(toSchoolId);
            if (!toSchool) {
                return { errors: 'Destination school not found' };
            }
            if (!toSchool.isActive) {
                return { errors: 'Cannot transfer to inactive school' };
            }
            if (toSchool.currentStudentCount >= toSchool.maxStudents) {
                return { errors: 'Destination school has reached maximum capacity' };
            }

            const fromSchoolId = student.schoolId;
            const fromClassroomId = student.classroomId;

            // Get current school name for history
            const fromSchool = await this.mongomodels.school.findById(fromSchoolId);

            // Add to previous schools history
            student.previousSchools.push({
                schoolId: fromSchoolId,
                schoolName: fromSchool ? fromSchool.name : 'Unknown',
                enrollmentDate: student.enrollmentDate,
                transferDate: new Date(),
                reason: reason || 'Transfer'
            });

            // Update student
            student.schoolId = toSchoolId;
            student.classroomId = null; // Remove from classroom
            student.enrollmentDate = new Date();
            student.status = 'transferred';
            student.updatedAt = new Date();

            await student.save();

            // Update student counts
            await this.mongomodels.school.findByIdAndUpdate(fromSchoolId, {
                $inc: { currentStudentCount: -1 }
            });
            await this.mongomodels.school.findByIdAndUpdate(toSchoolId, {
                $inc: { currentStudentCount: 1 }
            });

            // Update classroom count if was enrolled
            if (fromClassroomId) {
                await this.mongomodels.classroom.findByIdAndUpdate(fromClassroomId, {
                    $inc: { currentStudentCount: -1 }
                });
            }

            // Update status back to enrolled
            student.status = 'enrolled';
            await student.save();

            return {
                message: 'Student transferred successfully',
                student,
                transfer: {
                    from: fromSchool ? fromSchool.name : fromSchoolId,
                    to: toSchool.name,
                    date: new Date()
                }
            };
        } catch (error) {
            console.error('Transfer student error:', error);
            return { errors: 'Failed to transfer student' };
        }
    }

    /**
     * Enroll student in a classroom
     * POST /api/student/enrollInClassroom
     * Accessible by: school_admin (own school) or superadmin
     */
    async enrollInClassroom({ __schoolAdmin, studentId, classroomId }) {
        if (!studentId || !classroomId) {
            return { errors: 'Student ID and classroom ID are required' };
        }

        try {
            const student = await this.mongomodels.student.findById(studentId);
            if (!student) {
                return { errors: 'Student not found' };
            }

            // School admins can only manage students in their school
            if (__schoolAdmin.role !== 'superadmin' && student.schoolId.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This student belongs to a different school.' };
            }

            const classroom = await this.mongomodels.classroom.findById(classroomId);
            if (!classroom) {
                return { errors: 'Classroom not found' };
            }

            // Verify classroom belongs to student's school
            if (classroom.schoolId.toString() !== student.schoolId.toString()) {
                return { errors: 'Classroom does not belong to the student\'s school' };
            }

            if (!classroom.isActive) {
                return { errors: 'Cannot enroll in inactive classroom' };
            }

            // Check if already in this classroom
            if (student.classroomId && student.classroomId.toString() === classroomId) {
                return { errors: 'Student is already enrolled in this classroom' };
            }

            // Check classroom capacity
            if (classroom.currentStudentCount >= classroom.capacity) {
                return { errors: 'Classroom has reached maximum capacity' };
            }

            const previousClassroomId = student.classroomId;

            // Update student
            student.classroomId = classroomId;
            student.updatedAt = new Date();
            await student.save();

            // Update classroom counts
            if (previousClassroomId) {
                await this.mongomodels.classroom.findByIdAndUpdate(previousClassroomId, {
                    $inc: { currentStudentCount: -1 }
                });
            }
            await this.mongomodels.classroom.findByIdAndUpdate(classroomId, {
                $inc: { currentStudentCount: 1 }
            });

            return {
                message: 'Student enrolled in classroom successfully',
                student: await this.mongomodels.student.findById(studentId)
                    .populate('classroomId', 'name grade')
            };
        } catch (error) {
            console.error('Enroll in classroom error:', error);
            return { errors: 'Failed to enroll student in classroom' };
        }
    }
};
