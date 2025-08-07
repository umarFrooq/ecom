const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductByIdentifier,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes for getting products
router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin', 'editor'), createProduct); // Allow admin or editor to create

router.route('/:identifier') // Can be ID or slug
  .get(getProductByIdentifier)
  .put(protect, authorize('admin', 'editor'), updateProduct) // Allow admin or editor to update
  .delete(protect, authorize('admin'), deleteProduct); // Only admin can delete

// Nested route for reviews of a specific product
const reviewRouter = require('./reviewRoutes');
// Re-route GET /api/products/:productId/reviews to the review router
// The reviewRouter's getProductReviews will handle this if it checks req.params.productId
router.use('/:productId/reviews', (req, res, next) => {
    // Pass productId to the review router via req.params
    // The reviewRouter is already configured with mergeParams: true
    req.paramsFromProductRoute = { productId: req.params.productId }; // Or just let mergeParams handle it
    next();
}, reviewRouter);


module.exports = router;
