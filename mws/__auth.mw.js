module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next }) => {
        if (!req.headers.token) {
            console.log('token required but not found');
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
                console.log('failed to decode token');
                return managers.responseDispatcher.dispatch(res, {
                    ok: false,
                    code: 401,
                    errors: 'Invalid or expired token'
                });
            }
        } catch (err) {
            console.log('token verification error:', err.message);
            return managers.responseDispatcher.dispatch(res, {
                ok: false,
                code: 401,
                errors: 'Invalid or expired token'
            });
        }

        // Attach decoded token info
        next(decoded);
    };
};
