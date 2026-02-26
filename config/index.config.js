
require('dotenv').config();
const pjson                            = require('../package.json');
const utils                            = require('../libs/utils');

// Service Configuration
const SERVICE_NAME                     = (process.env.SERVICE_NAME) ? utils.slugify(process.env.SERVICE_NAME) : pjson.name;
const USER_PORT                        = process.env.USER_PORT || 5111;
const ENV                              = process.env.ENV || "development";

// Redis Configuration
const REDIS_URI                        = process.env.REDIS_URI || "redis://127.0.0.1:6379";
const CORTEX_REDIS                     = process.env.CORTEX_REDIS || REDIS_URI;
const CORTEX_PREFIX                    = process.env.CORTEX_PREFIX || 'school_mgmt';
const CORTEX_TYPE                      = process.env.CORTEX_TYPE || SERVICE_NAME;
const CACHE_REDIS                      = process.env.CACHE_REDIS || REDIS_URI;
const CACHE_PREFIX                     = process.env.CACHE_PREFIX || `${SERVICE_NAME}:cache`;

// MongoDB Configuration
const MONGO_URI                        = process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;

// Load environment-specific config
const config                           = require(`./envs/${ENV}.js`);

// Security Configuration
const LONG_TOKEN_SECRET                = process.env.LONG_TOKEN_SECRET || null;
const SHORT_TOKEN_SECRET               = process.env.SHORT_TOKEN_SECRET || null;
const NACL_SECRET                      = process.env.NACL_SECRET || null;

// Validate required secrets
if (!LONG_TOKEN_SECRET || !SHORT_TOKEN_SECRET || !NACL_SECRET) {
    throw Error('Missing required .env variables: LONG_TOKEN_SECRET, SHORT_TOKEN_SECRET, NACL_SECRET');
}

config.dotEnv = {
    SERVICE_NAME,
    ENV,
    USER_PORT,
    MONGO_URI,
    CORTEX_REDIS,
    CORTEX_PREFIX,
    CORTEX_TYPE,
    CACHE_REDIS,
    CACHE_PREFIX,
    LONG_TOKEN_SECRET,
    SHORT_TOKEN_SECRET,
};

module.exports = config;
