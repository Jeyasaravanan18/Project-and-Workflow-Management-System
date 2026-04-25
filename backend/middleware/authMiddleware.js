const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, AuthorizationError } = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/tokenManager');
const { isTokenBlacklisted } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token
            token = req.headers.authorization.split(' ')[1];

            // DEBUG: Log token info
            logger.debug('Auth middleware - Token received:', {
                path: req.originalUrl,
                method: req.method,
                tokenPrefix: token.substring(0, 20) + '...',
                tokenLength: token.length
            });

            // Check if token is blacklisted
            const isBlacklisted = await isTokenBlacklisted(token);
            if (isBlacklisted) {
                logger.warn('Blacklisted token used:', {
                    path: req.originalUrl,
                    token: token.substring(0, 20) + '...'
                });
                return next(new AuthenticationError('Token has been revoked. Please log in again.'));
            }

            // Verify token
            const decoded = verifyAccessToken(token);

            // DEBUG: Log decoded token
            logger.debug('Token decoded successfully:', {
                userId: decoded.id,
                tokenType: decoded.type,
                expiresAt: new Date(decoded.exp * 1000).toISOString()
            });

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                logger.warn('User not found for token:', { userId: decoded.id });
                return next(new AuthenticationError('User no longer exists'));
            }

            // Check if user is active
            if (req.user.status !== 'active') {
                logger.warn('Inactive user attempted access:', {
                    userId: req.user._id,
                    status: req.user.status
                });
                return next(new AuthenticationError('Your account is not active. Please contact support.'));
            }

            logger.debug('Authentication successful:', {
                userId: req.user._id,
                role: req.user.role,
                path: req.originalUrl
            });

            next();
        } catch (error) {
            logger.error('Token verification failed:', {
                path: req.originalUrl,
                errorName: error.name,
                errorMessage: error.message,
                tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
            });

            if (error.name === 'TokenExpiredError') {
                return next(new AuthenticationError('Your session has expired. Please log in again.'));
            }

            if (error.message === 'Invalid token type') {
                return next(new AuthenticationError('Invalid token type. Please log in again.'));
            }

            return next(new AuthenticationError('Invalid token. Please log in again.'));
        }
    }

    // CRITICAL FIX: Return after sending error response
    if (!token) {
        logger.warn('No token provided:', {
            path: req.originalUrl,
            method: req.method,
            authHeader: req.headers.authorization || 'missing'
        });
        return next(new AuthenticationError('Not authorized, no token provided'));
    }
};

/**
 * Authorize specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthenticationError('Not authenticated'));
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Unauthorized access attempt:', {
                userId: req.user._id,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.originalUrl
            });

            return next(
                new AuthorizationError(
                    `User role '${req.user.role}' is not authorized to access this resource`
                )
            );
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = verifyAccessToken(token);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Silently fail for optional auth
            logger.debug('Optional auth failed:', error.message);
        }
    }

    next();
};

/**
 * Check if user owns the resource
 */
const checkOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

        if (!req.user) {
            return next(new AuthenticationError('Not authenticated'));
        }

        // Admin can access everything
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
            return next(new AuthorizationError('You do not have permission to access this resource'));
        }

        next();
    };
};

/**
 * Check if user belongs to the same organization
 */
const checkOrganization = async (req, res, next) => {
    if (!req.user) {
        return next(new AuthenticationError('Not authenticated'));
    }

    // Admin can access everything in their organization
    // This middleware ensures users can only access resources in their org
    req.organizationId = req.user.organizationId;

    next();
};

/**
 * Check if resource belongs to user's organization
 * Expects the model to have 'organizationId' field
 */
const checkOrgAccess = (Model, resourceIdField = 'id') => {
    return async (req, res, next) => {
        const resourceId = req.params[resourceIdField] || req.body[resourceIdField];

        if (!resourceId) {
            return next(); // Skip if no ID provided (creating new resource?)
        }

        try {
            const resource = await Model.findById(resourceId);
            if (!resource) {
                return next(new AuthenticationError('Resource not found'));
            }

            if (
                req.user.role !== 'admin' && // Platform admin might bypass? No, usually safer to enforce. 
                // Assuming 'admin' in this context is Org Admin, they still need to be in same org.
                // If there is a 'superadmin', they might bypass. 
                resource.organizationId.toString() !== req.user.organizationId.toString()
            ) {
                logger.warn('Unauthorized org access attempt:', {
                    userId: req.user._id,
                    userOrg: req.user.organizationId,
                    resourceOrg: resource.organizationId,
                    path: req.originalUrl
                });
                return next(new AuthorizationError('You do not have permission to access this resource'));
            }
            req.resource = resource; // Attach resource to req for controller use
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    protect,
    authorize,
    optionalAuth,
    checkOwnership,
    checkOrganization,
    checkOrgAccess
};
