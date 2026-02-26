const http              = require('http');
const express           = require('express');
const cors              = require('cors');
const helmet            = require('helmet');
const rateLimit         = require('express-rate-limit');
const app               = express();

module.exports = class UserServer {
    constructor({config, managers}){
        this.config        = config;
        this.userApi       = managers.userApi;
    }

    /** for injecting middlewares */
    use(args){
        app.use(args);
    }

    /** server configs */
    run(){
        // Security headers with Helmet
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));

        // CORS configuration
        const corsOptions = {
            origin: process.env.ENV === 'production'
                ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
                : '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization', 'token'],
            credentials: true,
            maxAge: 86400 // 24 hours
        };
        app.use(cors(corsOptions));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
            message: {
                ok: false,
                errors: 'Too many requests, please try again later.',
                data: {}
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: (req) => {
                // Skip rate limiting for health check
                return req.path === '/health';
            }
        });
        app.use('/api', limiter);

        // Stricter rate limit for auth endpoints
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 20, // limit each IP to 20 login/register attempts per window
            message: {
                ok: false,
                errors: 'Too many authentication attempts, please try again later.',
                data: {}
            },
            standardHeaders: true,
            legacyHeaders: false,
        });
        app.use('/api/user/login', authLimiter);
        app.use('/api/user/register', authLimiter);

        // Body parsing with size limits
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        app.use('/static', express.static('public'));

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.status(200).json({
                ok: true,
                message: 'School Management API is running',
                timestamp: new Date().toISOString(),
                environment: process.env.ENV || 'development'
            });
        });

        // Request logging in development
        if (process.env.ENV !== 'production') {
            app.use((req, res, next) => {
                console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
                next();
            });
        }

        // API routes
        app.all('/api/:moduleName/:fnName', this.userApi.mw);

        // 404 handler
        app.use((req, res, next) => {
            res.status(404).json({
                ok: false,
                errors: 'Endpoint not found',
                data: {}
            });
        });

        // Global error handler
        app.use((err, req, res, next) => {
            console.error('Server Error:', err.stack);

            // Don't leak error details in production
            const errorMessage = process.env.ENV === 'production'
                ? 'Internal server error'
                : err.message;

            res.status(err.status || 500).json({
                ok: false,
                errors: errorMessage,
                data: {}
            });
        });

        let server = http.createServer(app);
        server.listen(this.config.dotEnv.USER_PORT, () => {
            console.log(`${(this.config.dotEnv.SERVICE_NAME).toUpperCase()} is running on port: ${this.config.dotEnv.USER_PORT}`);
            console.log(`Environment: ${this.config.dotEnv.ENV}`);
            console.log(`Health check: http://localhost:${this.config.dotEnv.USER_PORT}/health`);
        });
    }
}
