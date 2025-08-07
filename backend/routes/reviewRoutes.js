const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows access to :productId if nested

const {
  getProductReviews,
  addReview,
  deleteReview,
  updateReview
} = require('../controllers/reviewController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Route to get reviews for a specific product (e.g. /api/products/:productId/reviews)
// This will be handled by productRoutes.js calling this router.
// Or, if mounting this at /api/reviews, use query param: GET /api/reviews?productId=:productId

router.route('/')
  .get(getProductReviews) // Handles GET /api/reviews?productId=:productId
  .post(protect, authorize('customer', 'admin'), addReview); // POST /api/reviews (productId in body)

// Routes for specific review by ID
router.route('/:reviewId')
  .delete(protect, authorize('customer', 'admin', 'editor'), deleteReview)
  .put(protect, authorize('customer'), updateReview); // Only owner can update

module.exports = router;
