const express = require('express');
const router = express.Router();
const { handleContactForm, getContactMessages } = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware'); // Import auth middleware

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', handleContactForm);

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private/Admin
router.get('/', protect, admin, getContactMessages);


module.exports = router;
