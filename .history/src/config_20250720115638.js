/**
 * Configuration validator and manager for environment variables
 * Ensures all required variables are set and provides a central place to access configuration
 */

// Helper to validate environment variable exists
const requiredEnvVar = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

// Helper to get optional environment variable with default
const optionalEnvVar = (key, defaultValue) => {
    return process.env[key] || defaultValue;
};

// Trading bot configuration
const config = {
    // API Keys and endpoints (required)
    alpaca: {
        apiKey: requiredEnvVar('ALPACA_API_KEY'),
        secretKey: requiredEnvVar('ALPACA_SECRET_KEY'),
        baseUrl: requiredEnvVar('ALPACA_BASE_URL'),
        dataUrl: requiredEnvVar('ALPACA_DATA_URL')
    },
    
    // News API (optional)
    news: {
        apiKey: optionalEnvVar('NEWS_API_KEY', null)
    },
    
    // Server configuration
    server: {
        port: parseInt(optionalEnvVar('PORT', 3000)),
        environment: optionalEnvVar('NODE_ENV', 'development'),
        isProduction: optionalEnvVar('NODE_ENV', 'development') === 'production'
    },
    
    // Email configuration (for alerts)
    email: {
        host: optionalEnvVar('SMTP_HOST', null),
        port: parseInt(optionalEnvVar('SMTP_PORT', 587)),
        user: optionalEnvVar('SMTP_USER', null),
        pass: optionalEnvVar('SMTP_PASS', null),
        from: optionalEnvVar('EMAIL_FROM', null),
        enabled: Boolean(optionalEnvVar('SMTP_HOST', false) && optionalEnvVar('SMTP_USER', false))
    },
    
    // Trading parameters
    trading: {
        maxPositionSize: parseFloat(optionalEnvVar('MAX_POSITION_SIZE', 1000)),
        riskPercentage: parseFloat(optionalEnvVar('RISK_PERCENTAGE', 0.02)),
        minVolume: parseFloat(optionalEnvVar('MIN_VOLUME', 10000)),
        optionExpiryMonths: parseInt(optionalEnvVar('OPTION_EXPIRY_MONTHS', 8))
    }
};

// Validate configuration on startup
const validateConfig = () => {
    console.log('Validating environment configuration...');
    
    // Already validated required variables through requiredEnvVar function
    
    // Log configuration status (without showing secrets)
    console.log(`Server environment: ${config.server.environment}`);
    console.log(`Email notifications: ${config.email.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`News API: ${config.news.apiKey ? 'Configured' : 'Not configured'}`);
    console.log('Trading parameters:', {
        maxPositionSize: config.trading.maxPositionSize,
        riskPercentage: config.trading.riskPercentage * 100 + '%',
        minVolume: config.trading.minVolume,
        optionExpiryMonths: config.trading.optionExpiryMonths
    });
    
    console.log('Configuration validated successfully');
};

module.exports = {
    config,
    validateConfig
};
