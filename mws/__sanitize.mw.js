module.exports = ({ meta, config, managers }) => {
    return ({ req, res, next }) => {
        const sanitizeString = (str) => {
            if (typeof str !== 'string') return str;

            // Remove null bytes
            str = str.replace(/\0/g, '');

            // Trim whitespace
            str = str.trim();

            // Basic HTML entity encoding for XSS prevention
            str = str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;');

            return str;
        };

        const sanitizeObject = (obj) => {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj === 'string') return sanitizeString(obj);
            if (typeof obj !== 'object') return obj;
            if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));

            const sanitized = {};
            for (const key of Object.keys(obj)) {
                // Sanitize the key as well
                const sanitizedKey = sanitizeString(key);
                sanitized[sanitizedKey] = sanitizeObject(obj[key]);
            }
            return sanitized;
        };

        // Skip sanitization for certain content types (e.g., file uploads)
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('multipart/form-data')) {
            return next({});
        }

        next({});
    };
};
