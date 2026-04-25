const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 */
const initRedis = async () => {
    // Skip Redis if not configured
    if (!process.env.REDIS_URL) {
        logger.warn('Redis URL not configured. Running without Redis (in-memory fallback).');
        isRedisAvailable = false;
        return null;
    }

    try {
        redisClient = createClient({
            url: process.env.REDIS_URL,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        logger.error('Redis reconnection failed after 10 attempts');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
            isRedisAvailable = false;
        });

        redisClient.on('connect', () => {
            logger.info('Redis client connected');
            isRedisAvailable = true;
        });

        redisClient.on('ready', () => {
            logger.info('Redis client ready');
            isRedisAvailable = true;
        });

        redisClient.on('reconnecting', () => {
            logger.warn('Redis client reconnecting...');
        });

        await redisClient.connect();
        logger.info('✅ Redis connected successfully');
        isRedisAvailable = true;

        return redisClient;
    } catch (error) {
        logger.error('Failed to connect to Redis:', error.message);
        logger.warn('Continuing without Redis. Some features may be limited.');
        isRedisAvailable = false;
        return null;
    }
};

/**
 * Get Redis client
 */
const getRedisClient = () => {
    return redisClient;
};

/**
 * Check if Redis is available
 */
const isRedisReady = () => {
    return isRedisAvailable && redisClient && redisClient.isReady;
};

/**
 * Set key with expiration
 */
const setWithExpiry = async (key, value, expiryInSeconds) => {
    if (!isRedisReady()) {
        logger.debug('Redis not available, skipping cache set');
        return false;
    }

    try {
        await redisClient.setEx(key, expiryInSeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        logger.error('Redis SET error:', error);
        return false;
    }
};

/**
 * Get key
 */
const get = async (key) => {
    if (!isRedisReady()) {
        logger.debug('Redis not available, skipping cache get');
        return null;
    }

    try {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        logger.error('Redis GET error:', error);
        return null;
    }
};

/**
 * Delete key
 */
const del = async (key) => {
    if (!isRedisReady()) {
        return false;
    }

    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        logger.error('Redis DEL error:', error);
        return false;
    }
};

/**
 * Delete keys by pattern
 */
const delPattern = async (pattern) => {
    if (!isRedisReady()) {
        return false;
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        return true;
    } catch (error) {
        logger.error('Redis DEL pattern error:', error);
        return false;
    }
};

/**
 * Add to set
 */
const sadd = async (key, ...members) => {
    if (!isRedisReady()) {
        return false;
    }

    try {
        await redisClient.sAdd(key, members);
        return true;
    } catch (error) {
        logger.error('Redis SADD error:', error);
        return false;
    }
};

/**
 * Remove from set
 */
const srem = async (key, ...members) => {
    if (!isRedisReady()) {
        return false;
    }

    try {
        await redisClient.sRem(key, members);
        return true;
    } catch (error) {
        logger.error('Redis SREM error:', error);
        return false;
    }
};

/**
 * Get set members
 */
const smembers = async (key) => {
    if (!isRedisReady()) {
        return [];
    }

    try {
        return await redisClient.sMembers(key);
    } catch (error) {
        logger.error('Redis SMEMBERS error:', error);
        return [];
    }
};

/**
 * Blacklist a token
 */
const blacklistToken = async (token) => {
    if (!isRedisReady()) {
        logger.warn('Redis not available, cannot blacklist token');
        return false;
    }

    try {
        const decoded = require('jsonwebtoken').decode(token);
        if (!decoded || !decoded.exp) {
            return false;
        }

        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await redisClient.setEx(`blacklist:${token}`, ttl, 'revoked');
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Error blacklisting token:', error);
        return false;
    }
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = async (token) => {
    if (!isRedisReady()) {
        return false; // If Redis is down, allow the request
    }

    try {
        const result = await redisClient.get(`blacklist:${token}`);
        return result === 'revoked';
    } catch (error) {
        logger.error('Error checking token blacklist:', error);
        return false;
    }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed');
    }
};

module.exports = {
    initRedis,
    getRedisClient,
    isRedisReady,
    setWithExpiry,
    get,
    del,
    delPattern,
    sadd,
    srem,
    smembers,
    blacklistToken,
    isTokenBlacklisted,
    closeRedis
};
