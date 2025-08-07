const express = require('express');
const router = express.Router();
const { handlePaymentWebhook } = require('../controllers/webhookController');

// This route should be public but protected by signature verification
router.post('/payment-notification', handlePaymentWebhook);

module.exports = router;
