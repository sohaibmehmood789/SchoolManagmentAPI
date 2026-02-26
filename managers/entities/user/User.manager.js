const { nanoid } = require('nanoid');

module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.httpExposed         = ['register', 'login', 'get=profile'];
    }


    async register({username, email, password, role, schoolId}){
        const userData = {username, email, password, role, schoolId};

        // Data validation
        let validationResult = await this.validators.user.register(userData);
        if(validationResult) return { errors: validationResult };

        // Check if user already exists
        const existingUser = await this.mongomodels.user.findOne({
            $or: [{ email }, { username }]
        });

        if(existingUser) {
            if(existingUser.email === email) {
                return { errors: 'Email already registered' };
            }
            return { errors: 'Username already taken' };
        }

        // Only superadmins can create other superadmins (handled in RBAC middleware later)
        // For now, default to school_admin, first user becomes superadmin
        const userCount = await this.mongomodels.user.countDocuments();
        const finalRole = userCount === 0 ? 'superadmin' : (role || 'school_admin');

        // If school_admin, schoolId is required
        if(finalRole === 'school_admin' && !schoolId) {
            // Will be assigned later when creating via admin
        }

        // Generate user key for token
        const userKey = nanoid(32);

        // Create user
        const newUser = new this.mongomodels.user({
            username,
            email,
            password,
            role: finalRole,
            schoolId: finalRole === 'superadmin' ? null : schoolId,
            key: userKey,
            isActive: true
        });

        try {
            await newUser.save();
        } catch(error) {
            console.error('User creation error:', error);
            return { errors: 'Failed to create user' };
        }

        // Generate tokens
        const longToken = this.tokenManager.genLongToken({
            userId: newUser._id.toString(),
            userKey: newUser.key,
            role: newUser.role,
            schoolId: newUser.schoolId ? newUser.schoolId.toString() : null
        });

        return {
            user: newUser.toJSON(),
            longToken
        };
    }

    /**
     * User login
     * POST /api/user/login
     */
    async login({email, password}){
        // Data validation
        let validationResult = await this.validators.user.login({email, password});
        if(validationResult) return { errors: validationResult };

        // Find user by email
        const user = await this.mongomodels.user.findOne({ email, isActive: true });

        if(!user) {
            return { errors: 'Invalid email or password' };
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid) {
            return { errors: 'Invalid email or password' };
        }

        // Generate tokens
        const longToken = this.tokenManager.genLongToken({
            userId: user._id.toString(),
            userKey: user.key,
            role: user.role,
            schoolId: user.schoolId ? user.schoolId.toString() : null
        });

        return {
            user: user.toJSON(),
            longToken
        };
    }

    /**
     * Get user profile (requires authentication)
     * GET /api/user/profile
     */
    async profile({__longToken}){
        const userId = __longToken.userId;

        const user = await this.mongomodels.user.findById(userId).populate('schoolId', 'name');

        if(!user) {
            return { errors: 'User not found' };
        }

        return {
            user: user.toJSON()
        };
    }

}
