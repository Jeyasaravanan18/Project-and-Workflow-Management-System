const Webhook = require('../models/Webhook');
const crypto = require('crypto');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * @desc    Get all webhooks
 * @route   GET /api/webhooks
 * @access  Private (Admin)
 */
const getWebhooks = catchAsync(async (req, res) => {
    const webhooks = await Webhook.find({ organizationId: req.user.organizationId })
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: webhooks
    });
});

/**
 * @desc    Create webhook
 * @route   POST /api/webhooks
 * @access  Private (Admin)
 */
const createWebhook = catchAsync(async (req, res) => {
    const { url, events } = req.body;

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

    const webhook = await Webhook.create({
        organizationId: req.user.organizationId,
        url,
        events,
        secret
    });

    res.status(201).json({
        success: true,
        data: webhook
    });
});

/**
 * @desc    Delete webhook
 * @route   DELETE /api/webhooks/:id
 * @access  Private (Admin)
 */
const deleteWebhook = catchAsync(async (req, res) => {
    const webhook = await Webhook.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.user.organizationId
    });

    if (!webhook) {
        return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    res.json({
        success: true,
        message: 'Webhook deleted'
    });
});

module.exports = {
    getWebhooks,
    createWebhook,
    deleteWebhook
};
