module.exports = class Classroom {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.httpExposed = [
            'post=createClassroom',
            'get=getClassroom',
            'get=getClassrooms',
            'put=updateClassroom',
            'delete=deleteClassroom'
        ];
    }

    /**
     * Create a new classroom
     * POST /api/classroom/createClassroom
     * Accessible by: school_admin (own school) or superadmin
     */
    async createClassroom({ __schoolAdmin, name, schoolId, grade, section, capacity, roomNumber, floor, resources, schedule }) {
        // For school admins, use their assigned school
        const targetSchoolId = __schoolAdmin.role === 'superadmin' ? schoolId : __schoolAdmin.schoolId;

        if (!targetSchoolId) {
            return { errors: 'School ID is required' };
        }

        const classroomData = { name, schoolId: targetSchoolId, grade, section, capacity, roomNumber, floor };

        // Validate input
        let validationResult = await this.validators.classroom.createClassroom(classroomData);
        if (validationResult) return { errors: validationResult };

        // Verify school exists
        const school = await this.mongomodels.school.findById(targetSchoolId);
        if (!school) {
            return { errors: 'School not found' };
        }

        if (!school.isActive) {
            return { errors: 'Cannot add classroom to inactive school' };
        }

        // Check if classroom with same name exists in this school
        const existingClassroom = await this.mongomodels.classroom.findOne({
            schoolId: targetSchoolId,
            name: name.trim()
        });

        if (existingClassroom) {
            return { errors: 'A classroom with this name already exists in this school' };
        }

        // Create classroom
        const newClassroom = new this.mongomodels.classroom({
            name: name.trim(),
            schoolId: targetSchoolId,
            grade,
            section,
            capacity: capacity || 30,
            roomNumber,
            floor,
            resources: resources || [],
            schedule: schedule || {},
            isActive: true,
            createdBy: __schoolAdmin.userId
        });

        try {
            await newClassroom.save();
        } catch (error) {
            console.error('Classroom creation error:', error);
            if (error.code === 11000) {
                return { errors: 'A classroom with this name already exists in this school' };
            }
            return { errors: 'Failed to create classroom' };
        }

        return {
            classroom: newClassroom
        };
    }

    /**
     * Get a single classroom by ID
     * GET /api/classroom/getClassroom
     * Accessible by: school_admin (own school) or superadmin
     */
    async getClassroom({ __schoolAdmin, classroomId }) {
        if (!classroomId) {
            return { errors: 'Classroom ID is required' };
        }

        try {
            const classroom = await this.mongomodels.classroom.findById(classroomId)
                .populate('schoolId', 'name')
                .populate('createdBy', 'username email');

            if (!classroom) {
                return { errors: 'Classroom not found' };
            }

            // School admins can only view classrooms in their school
            if (__schoolAdmin.role !== 'superadmin' && classroom.schoolId._id.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This classroom belongs to a different school.' };
            }

            return { classroom };
        } catch (error) {
            console.error('Get classroom error:', error);
            return { errors: 'Invalid classroom ID format' };
        }
    }

    /**
     * Get all classrooms (filtered by school for school_admin)
     * GET /api/classroom/getClassrooms
     * Accessible by: school_admin (own school) or superadmin
     */
    async getClassrooms({ __schoolAdmin, schoolId, page = 1, limit = 10, isActive, grade, search }) {
        const query = {};

        // School admins can only see their school's classrooms
        if (__schoolAdmin.role === 'superadmin') {
            if (schoolId) {
                query.schoolId = schoolId;
            }
        } else {
            query.schoolId = __schoolAdmin.schoolId;
        }

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        // Filter by grade
        if (grade) {
            query.grade = grade;
        }

        // Search by name or room number
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { roomNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        try {
            const [classrooms, total] = await Promise.all([
                this.mongomodels.classroom.find(query)
                    .populate('schoolId', 'name')
                    .populate('createdBy', 'username email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                this.mongomodels.classroom.countDocuments(query)
            ]);

            return {
                classrooms,
                pagination: {
                    current: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            };
        } catch (error) {
            console.error('Get classrooms error:', error);
            return { errors: 'Failed to fetch classrooms' };
        }
    }

    /**
     * Update a classroom
     * PUT /api/classroom/updateClassroom
     * Accessible by: school_admin (own school) or superadmin
     */
    async updateClassroom({ __schoolAdmin, classroomId, name, grade, section, capacity, roomNumber, floor, resources, schedule, isActive }) {
        if (!classroomId) {
            return { errors: 'Classroom ID is required' };
        }

        const updateData = { classroomId, name, grade, section, capacity, roomNumber, floor, isActive };

        // Validate input
        let validationResult = await this.validators.classroom.updateClassroom(updateData);
        if (validationResult) return { errors: validationResult };

        try {
            const classroom = await this.mongomodels.classroom.findById(classroomId);

            if (!classroom) {
                return { errors: 'Classroom not found' };
            }

            // School admins can only update classrooms in their school
            if (__schoolAdmin.role !== 'superadmin' && classroom.schoolId.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This classroom belongs to a different school.' };
            }

            // Check if new name conflicts with another classroom in the same school
            if (name && name.trim() !== classroom.name) {
                const existingClassroom = await this.mongomodels.classroom.findOne({
                    schoolId: classroom.schoolId,
                    name: name.trim(),
                    _id: { $ne: classroomId }
                });
                if (existingClassroom) {
                    return { errors: 'A classroom with this name already exists in this school' };
                }
                classroom.name = name.trim();
            }

            // Check capacity constraints
            if (capacity !== undefined) {
                if (capacity < classroom.currentStudentCount) {
                    return { errors: `Cannot set capacity below current student count (${classroom.currentStudentCount})` };
                }
                classroom.capacity = capacity;
            }

            // Update other fields
            if (grade !== undefined) classroom.grade = grade;
            if (section !== undefined) classroom.section = section;
            if (roomNumber !== undefined) classroom.roomNumber = roomNumber;
            if (floor !== undefined) classroom.floor = floor;
            if (resources !== undefined) classroom.resources = resources;
            if (schedule !== undefined) classroom.schedule = schedule;
            if (isActive !== undefined) classroom.isActive = isActive;

            classroom.updatedAt = new Date();

            await classroom.save();

            return { classroom };
        } catch (error) {
            console.error('Update classroom error:', error);
            return { errors: 'Failed to update classroom' };
        }
    }

    /**
     * Delete a classroom
     * DELETE /api/classroom/deleteClassroom
     * Accessible by: school_admin (own school) or superadmin
     */
    async deleteClassroom({ __schoolAdmin, classroomId }) {
        if (!classroomId) {
            return { errors: 'Classroom ID is required' };
        }

        try {
            const classroom = await this.mongomodels.classroom.findById(classroomId);

            if (!classroom) {
                return { errors: 'Classroom not found' };
            }

            // School admins can only delete classrooms in their school
            if (__schoolAdmin.role !== 'superadmin' && classroom.schoolId.toString() !== __schoolAdmin.schoolId) {
                return { errors: 'Access denied. This classroom belongs to a different school.' };
            }

            // Check if classroom has students
            if (classroom.currentStudentCount > 0) {
                return { errors: `Cannot delete classroom with ${classroom.currentStudentCount} enrolled students. Transfer or remove students first.` };
            }

            await this.mongomodels.classroom.findByIdAndDelete(classroomId);

            return {
                message: 'Classroom deleted successfully',
                deletedClassroom: {
                    id: classroom._id,
                    name: classroom.name
                }
            };
        } catch (error) {
            console.error('Delete classroom error:', error);
            return { errors: 'Failed to delete classroom' };
        }
    }
};
