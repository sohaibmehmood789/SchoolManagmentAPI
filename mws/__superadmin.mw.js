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

        if (decoded.role !== 'superadmin') {
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 403,
                errors: 'Access denied. Superadmin privileges required.'
            });
        }

        next(decoded);
    };
};
