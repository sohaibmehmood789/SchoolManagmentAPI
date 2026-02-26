module.exports = class School {

    constructor({ utils, cache, config, cortex, managers, validators, mongomodels } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.mongomodels = mongomodels;
        this.httpExposed = [
            'post=createSchool',
            'get=getSchool',
            'get=getAllSchools',
            'put=updateSchool',
            'delete=deleteSchool'
        ];
    }

    async createSchool({ __superadmin, name, address, phone, email, website, establishedYear, schoolType, maxStudents }) {
        const schoolData = { name, address, phone, email, website, establishedYear, schoolType, maxStudents };

        // Validate input
        let validationResult = await this.validators.school.createSchool(schoolData);
        if (validationResult) return { errors: validationResult };

        // Check if school with same name already exists
        const existingSchool = await this.mongomodels.school.findOne({ name: name.trim() });
        if (existingSchool) {
            return { errors: 'A school with this name already exists' };
        }

        // Create school
        const newSchool = new this.mongomodels.school({
            name: name.trim(),
            address: address || {},
            phone,
            email,
            website,
            establishedYear,
            schoolType: schoolType || 'k-12',
            maxStudents: maxStudents || 1000,
            isActive: true,
            createdBy: __superadmin.userId
        });

        try {
            await newSchool.save();
        } catch (error) {
            console.error('School creation error:', error);
            return { errors: 'Failed to create school' };
        }

        return {
            school: newSchool
        };
    }

    async getSchool({ __superadmin, schoolId }) {
        if (!schoolId) {
            return { errors: 'School ID is required' };
        }

        try {
            const school = await this.mongomodels.school.findById(schoolId)
                .populate('createdBy', 'username email');

            if (!school) {
                return { errors: 'School not found' };
            }

            return { school };
        } catch (error) {
            console.error('Get school error:', error);
            return { errors: 'Invalid school ID format' };
        }
    }

    async getAllSchools({ __superadmin, page = 1, limit = 10, isActive, schoolType, search }) {
        const query = {};

        // Filter by active status
        if (isActive !== undefined) {
            query.isActive = isActive === 'true' || isActive === true;
        }

        // Filter by school type
        if (schoolType) {
            query.schoolType = schoolType;
        }

        // Search by name or city
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } }
            ];
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        try {
            const [schools, total] = await Promise.all([
                this.mongomodels.school.find(query)
                    .populate('createdBy', 'username email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                this.mongomodels.school.countDocuments(query)
            ]);

            return {
                schools,
                pagination: {
                    current: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            };
        } catch (error) {
            console.error('Get all schools error:', error);
            return { errors: 'Failed to fetch schools' };
        }
    }

    async updateSchool({ __superadmin, schoolId, name, address, phone, email, website, establishedYear, schoolType, maxStudents, isActive }) {
        if (!schoolId) {
            return { errors: 'School ID is required' };
        }

        const updateData = { schoolId, name, address, phone, email, website, establishedYear, schoolType, maxStudents, isActive };

        // Validate input
        let validationResult = await this.validators.school.updateSchool(updateData);
        if (validationResult) return { errors: validationResult };

        try {
            const school = await this.mongomodels.school.findById(schoolId);

            if (!school) {
                return { errors: 'School not found' };
            }

            // Check if new name conflicts with another school
            if (name && name.trim() !== school.name) {
                const existingSchool = await this.mongomodels.school.findOne({
                    name: name.trim(),
                    _id: { $ne: schoolId }
                });
                if (existingSchool) {
                    return { errors: 'A school with this name already exists' };
                }
            }

            // Update fields
            if (name) school.name = name.trim();
            if (address) school.address = { ...school.address, ...address };
            if (phone !== undefined) school.phone = phone;
            if (email !== undefined) school.email = email;
            if (website !== undefined) school.website = website;
            if (establishedYear !== undefined) school.establishedYear = establishedYear;
            if (schoolType) school.schoolType = schoolType;
            if (maxStudents !== undefined) school.maxStudents = maxStudents;
            if (isActive !== undefined) school.isActive = isActive;

            await school.save();

            return { school };
        } catch (error) {
            console.error('Update school error:', error);
            return { errors: 'Failed to update school' };
        }
    }

    async deleteSchool({ __superadmin, schoolId }) {
        if (!schoolId) {
            return { errors: 'School ID is required' };
        }

        try {
            const school = await this.mongomodels.school.findById(schoolId);

            if (!school) {
                return { errors: 'School not found' };
            }

            // Check if school has students
            const studentCount = await this.mongomodels.student.countDocuments({ schoolId });
            if (studentCount > 0) {
                return {
                    errors: `Cannot delete school. ${studentCount} students are enrolled. Transfer or remove students first.`
                };
            }

            // Check if school has classrooms
            const classroomCount = await this.mongomodels.classroom.countDocuments({ schoolId });
            if (classroomCount > 0) {
                return {
                    errors: `Cannot delete school. ${classroomCount} classrooms exist. Remove classrooms first.`
                };
            }

            // Soft delete - mark as inactive instead of removing
            school.isActive = false;
            await school.save();

            return {
                message: 'School deactivated successfully',
                school
            };
        } catch (error) {
            console.error('Delete school error:', error);
            return { errors: 'Failed to delete school' };
        }
    }
};
