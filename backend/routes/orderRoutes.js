const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/authMiddleware');

// All routes here are protected by default (user must be logged in)
router.use(protect);

router.route('/')
  .post(authorize('customer', 'admin'), createOrder) // Customer creates order, admin might for manual entry
  .get(authorize('admin', 'editor'), getAllOrders); // Admin/editor get all orders

router.route('/myorders')
  .get(authorize('customer'), getMyOrders); // Customer gets their own orders

router.route('/:id')
  .get(authorize('customer', 'admin', 'editor'), getOrderById); // Customer (own), Admin, Editor can get by ID

router.route('/:id/pay')
  .put(authorize('customer', 'admin'), updateOrderToPaid); // Customer (e.g. after redirect from payment) or Admin

router.route('/:id/deliver')
  .put(authorize('admin', 'editor'), updateOrderToDelivered); // Admin/Editor marks as delivered

router.route('/:id/status')
    .put(authorize('admin', 'editor'), updateOrderStatus); // Admin/Editor updates general status

module.exports = router;
