const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger');

// Token types
const TOKEN_TYPES = {
    ACCESS: 'access',
    REFRESH: 'refresh',
    RESET_PASSWORD: 'reset_password',
    EMAIL_VERIFICATION: 'email_verification'
};

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId, type: TOKEN_TYPES.ACCESS },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId, type: TOKEN_TYPES.REFRESH },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (userId) => {
    return {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId)
    };
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== TOKEN_TYPES.ACCESS) {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        logger.error('Access token verification failed:', error.message);
        throw error;
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );
        if (decoded.type !== TOKEN_TYPES.REFRESH) {
            throw new Error('Invalid token type');
        }
        return decoded;
    } catch (error) {
        logger.error('Refresh token verification failed:', error.message);
        throw error;
    }
};

/**
 * Generate random token for password reset, email verification, etc.
 */
const generateRandomToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for storage
 */
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Get token expiry time
 */
const getTokenExpiry = (token) => {
    try {
        const decoded = jwt.decode(token);
        return decoded.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
        return null;
    }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
    const expiry = getTokenExpiry(token);
    return expiry ? expiry < new Date() : true;
};

module.exports = {
    TOKEN_TYPES,
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyAccessToken,
    verifyRefreshToken,
    generateRandomToken,
    hashToken,
    getTokenExpiry,
    isTokenExpired
};
