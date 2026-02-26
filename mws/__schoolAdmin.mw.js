module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next }) => {
        if (!req.headers.token) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 401,
                errors: 'Authentication required'
            });
        }

        let decoded = null;
        try {
            decoded = managers.token.verifyLongToken({ token: req.headers.token });
            if (!decoded) {
                return managers.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 401,
                    errors: 'Invalid or expired token'
                });
            }
        } catch (err) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 401,
                errors: 'Invalid or expired token'
            });
        }

        // Superadmins can access everything
        if (decoded.role === 'superadmin') {
            return next(decoded);
        }

        // Must be school_admin
        if (decoded.role !== 'school_admin') {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 403,
                errors: 'Access denied. School administrator privileges required.'
            });
        }

        // School admin must have a schoolId assigned
        if (!decoded.schoolId) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 403,
                errors: 'Access denied. No school assigned to your account.'
            });
        }

        // Check if request is trying to access a different school
        const requestSchoolId = req.body?.schoolId || req.params?.schoolId || req.query?.schoolId;

        if (requestSchoolId && requestSchoolId !== decoded.schoolId) {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 403,
                errors: 'Access denied. You can only access your assigned school.'
            });
        }

        next(decoded);
    };
};
