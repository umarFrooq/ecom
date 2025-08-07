const express = require('express');
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../controllers/cartController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All cart routes are protected and for 'customer' or 'admin' (admin might view/manage for support)
// For simplicity, let's assume 'customer' role is the primary interactor for their own cart.
// Admins typically wouldn't directly manipulate a user's cart this way, but through user management.
router.use(protect);
// router.use(authorize('customer')); // Apply role authorization if only customers manage their cart

router.route('/')
  .get(authorize('customer', 'admin'), getCart) // Customer gets their cart, admin might for specific user (needs user ID then)
                                                // For now, getCart in controller assumes req.user.id
  .post(authorize('customer'), addItemToCart)
  .delete(authorize('customer'), clearCart);

router.route('/item/:productId')
  .put(authorize('customer'), updateCartItemQuantity)
  .delete(authorize('customer'), removeCartItem);

module.exports = router;
