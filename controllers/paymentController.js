// @desc    Payment controller
// @route   POST /api/payments
// @access  Private
const checkout = require('checkout');
const easypaisa = require('easypaisa');
const axios = require('axios');

// @desc    Create a checkout.com payment session
// @route   POST /api/payments/checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res, next) => {
    res.status(200).json({ success: true, message: 'Checkout session created' });
};

// @desc    Create an easypaisa payment session
// @route   POST /api/payments/easypaisa-session
// @access  Private
exports.createEasypaisaSession = async (req, res, next) => {
    res.status(200).json({ success: true, message: 'Easypaisa session created' });
};

// @desc    Create a jazzcash payment session
// @route   POST /api/payments/jazzcash-session
// @access  Private
exports.createJazzcashSession = async (req, res, next) => {
    res.status(200).json({ success: true, message: 'Jazzcash session created' });
};
