const Webhook = require('../models/Webhook');
const crypto = require('crypto');
const axios = require('axios'); // User must install axios if not present, but using fetch is also an option. Assuming axios or fetch is available in node 18+. Let's use fetch.
const logger = require('../utils/logger');

// Using fetch (available in Node 18+) to avoid adding dependency if possible, but axios is robust.
// Let's add axios to package.json later if needed, or use native fetch.
// Using native fetch.

const dispatchEvent = async (organizationId, event, payload) => {
    try {
        const webhooks = await Webhook.find({
            organizationId,
            events: event,
            isActive: true
        });

        if (webhooks.length === 0) return;

        const promises = webhooks.map(async (webhook) => {
            try {
                const timestamp = Date.now();
                const payloadString = JSON.stringify({ event, timestamp, payload });

                // Create signature: HMAC-SHA256(payload, secret)
                const signature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(payloadString)
                    .digest('hex');

                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-ProjectFlow-Signature': signature,
                        'X-ProjectFlow-Event': event,
                        'X-ProjectFlow-Timestamp': timestamp.toString()
                    },
                    body: payloadString
                });

                if (!response.ok) {
                    throw new Error(`Status ${response.status}`);
                }

                // Reset failure count on success
                if (webhook.failureCount > 0) {
                    webhook.failureCount = 0;
                    await webhook.save();
                }

            } catch (error) {
                logger.error(`Webhook delivery failed for ${webhook._id}`, { error: error.message });

                // Increment failure count
                webhook.failureCount += 1;
                // Deactivate if too many failures
                if (webhook.failureCount >= 10) {
                    webhook.isActive = false;
                    logger.warn(`Webhook ${webhook._id} deactivated due to failures`);
                }
                await webhook.save();
            }
        });

        // Fire and forget, don't block
        Promise.allSettled(promises);

    } catch (error) {
        logger.error('Webhook dispatch error', { error: error.message });
    }
};

module.exports = {
    dispatchEvent
};
