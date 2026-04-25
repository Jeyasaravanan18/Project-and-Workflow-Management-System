const express = require('express');
const router = express.Router();
const {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    acceptInvitation,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
    registerValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    resetPasswordValidation,
    acceptInvitationValidation
} = require('../middleware/validators/authValidator');

// Public routes with rate limiting
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new organization and admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - organizationName
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               organizationName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', registerValidation, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/refresh', refreshTokenValidation, validate, refreshToken);
router.post('/accept-invitation', acceptInvitationValidation, validate, acceptInvitation);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.put('/reset-password/:resetToken', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
