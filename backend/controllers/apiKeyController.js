const ApiKey = require('../models/ApiKey');
const crypto = require('crypto');
const { catchAsync } = require('../middleware/errorHandler');
const { NotFoundError } = require('../utils/AppError');

/**
 * @desc    Get all API keys
 * @route   GET /api/keys
 * @access  Private
 */
const getApiKeys = catchAsync(async (req, res) => {
    const keys = await ApiKey.find({ userId: req.user._id })
        .select('name prefix scopes lastUsed isActive createdAt')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: keys
    });
});

/**
 * @desc    Create API key
 * @route   POST /api/keys
 * @access  Private
 */
const createApiKey = catchAsync(async (req, res) => {
    const { name, scopes } = req.body;

    // Generate a random key
    const rawKey = `hh_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = rawKey.substring(0, 10);
    const hashedKey = ApiKey.hashKey(rawKey);

    const apiKey = await ApiKey.create({
        userId: req.user._id,
        organizationId: req.user.organizationId,
        name,
        key: hashedKey,
        prefix,
        scopes: scopes || ['read']
    });

    res.status(201).json({
        success: true,
        data: {
            ...apiKey.toObject(),
            key: rawKey // Only return raw key once
        }
    });
});

/**
 * @desc    Revoke API key
 * @route   DELETE /api/keys/:id
 * @access  Private
 */
const revokeApiKey = catchAsync(async (req, res) => {
    const apiKey = await ApiKey.findOne({
        _id: req.params.id,
        userId: req.user._id
    });

    if (!apiKey) {
        throw new NotFoundError('API Key not found');
    }

    await apiKey.deleteOne();

    res.json({
        success: true,
        message: 'API Key revoked'
    });
});

module.exports = {
    getApiKeys,
    createApiKey,
    revokeApiKey
};
