const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    createEasypaisaSession,
    createJazzcashSession,
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

router.post('/checkout-session', protect, createCheckoutSession);
router.post('/easypaisa-session', protect, createEasypaisaSession);
router.post('/jazzcash-session', protect, createJazzcashSession);

module.exports = router;
