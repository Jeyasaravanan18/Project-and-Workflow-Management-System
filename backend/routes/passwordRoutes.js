const express = require('express');
const router = express.Router();
const {
    forgotPassword,
    verifyResetToken,
    resetPassword,
    changePassword
} = require('../controllers/passwordController');
const { protect } = require('../middleware/authMiddleware');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const {
    forgotPasswordValidation,
    resetPasswordValidation,
    changePasswordValidation
} = require('../middleware/validators/authValidator');

// Public routes with rate limiting
router.post('/forgot', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.get('/verify-token/:token', verifyResetToken);
router.post('/reset', resetPasswordValidation, validate, resetPassword);

// Protected route
router.post('/change', protect, changePasswordValidation, validate, changePassword);

module.exports = router;
