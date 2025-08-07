const express = require('express');
const router = express.Router();
const {
    loginAdmin, // Should perhaps be renamed to loginUser or have a generic login
    registerUser,
    getMe,
    logout,
    updateUserDetails,
    forgotPassword,
    resetPassword,
    getAllUsers // Added getAllUsers
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware'); // Added authorize

// Assuming loginAdmin is generic enough for username/password login for any role
// If admin login is special (e.g. different fields or checks), it might need its own route
router.post('/login', loginAdmin);
router.post('/register', registerUser);

router.get('/me', protect, getMe);
router.put('/me/details', protect, updateUserDetails);

router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

router.get('/logout', protect, logout);

// Admin specific routes for user management
router.get('/users', protect, authorize('admin'), getAllUsers); // Get all users (Admin only)
// TODO: Routes for admin to update user role/status, delete user, create admin/editor users

module.exports = router;
