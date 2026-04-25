const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Configure security headers using Helmet
 */
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for development
    crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * Sanitize request data against NoSQL injection
 */
const sanitizeData = mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Potential NoSQL injection attempt detected in ${key}`);
    }
});

/**
 * Prevent XSS attacks
 */
const preventXSS = xss();

/**
 * Prevent HTTP Parameter Pollution
 */
const preventHPP = hpp({
    whitelist: [
        'page',
        'limit',
        'sort',
        'status',
        'priority',
        'role'
    ]
});

/**
 * Apply all security middleware
 */
const applySecurityMiddleware = (app) => {
    app.use(securityHeaders);
    app.use(sanitizeData);
    app.use(preventXSS);
    app.use(preventHPP);

    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
};

module.exports = {
    securityHeaders,
    sanitizeData,
    preventXSS,
    preventHPP,
    applySecurityMiddleware
};
