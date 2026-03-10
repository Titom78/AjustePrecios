require('dotenv').config();

const REQUIRED_DB_ENV_VARS = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME'];

const toBool = (value, fallback = false) => {
    if (value === undefined || value === null || value === '') return fallback;
    return String(value).toLowerCase() === 'true';
};

const toInt = (value, fallback) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const getMissingDbEnvVars = () => REQUIRED_DB_ENV_VARS.filter((key) => !process.env[key]);

const assertDbEnvVars = () => {
    const missing = getMissingDbEnvVars();
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
    }
};

const getSqlConfig = ({ validateRequired = true } = {}) => {
    if (validateRequired) {
        assertDbEnvVars();
    }

    return {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        database: process.env.DB_NAME,
        port: toInt(process.env.DB_PORT, 1433),
        options: {
            encrypt: toBool(process.env.DB_ENCRYPT, false),
            trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
            enableArithAbort: true,
            connectTimeout: toInt(process.env.DB_CONNECT_TIMEOUT, 30000),
        },
    };
};

const getDbTarget = () => ({
    host: process.env.DB_SERVER || '',
    port: toInt(process.env.DB_PORT, 1433),
});

module.exports = {
    getSqlConfig,
    getDbTarget,
    assertDbEnvVars,
    REQUIRED_DB_ENV_VARS,
};
