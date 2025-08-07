const Review = require('../models/Review');
const Product = require('../models/Product');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get reviews for a product
// @route   GET /api/products/:productId/reviews  (or /api/reviews?productId=...)
// @route   GET /api/reviews?productId=:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.query.productId;
    if (!productId) {
      return next(new ErrorResponse('Product ID is required to fetch reviews', 400));
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'username firstName lastName') // Populate some user details
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a review for a product
// @route   POST /api/products/:productId/reviews (or /api/reviews)
// @access  Private (Customer)
exports.addReview = async (req, res, next) => {
  const productId = req.params.productId || req.body.productId; // Allow productId in body too
  const { rating, comment } = req.body;
  const userId = req.user.id; // From authMiddleware

  if (!productId) {
    return next(new ErrorResponse('Product ID is required to add a review', 400));
  }
  if (rating === undefined) {
    return next(new ErrorResponse('Rating is required', 400));
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorResponse(`Product not found with id ${productId}`, 404));
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product: productId, user: userId });
    if (existingReview) {
      return next(new ErrorResponse('You have already reviewed this product', 400));
    }

    // Optional: Check if user has purchased this product (more complex, requires order history check)
    // const orders = await Order.find({ user: userId, 'orderItems.product': productId, isPaid: true });
    // if (orders.length === 0 && req.user.role !== 'admin') { // Allow admin to bypass purchase check
    //   return next(new ErrorResponse('You must purchase this product to review it', 403));
    // }

    const review = new Review({
      product: productId,
      user: userId,
      username: req.user.username, // Or a display name if available
      rating,
      comment,
    });

    await review.save(); // This will trigger the post('save') hook in Review model to update product's avgRating

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error (product+user index)
        return next(new ErrorResponse('You have already reviewed this product.', 400));
    }
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Review Owner or Admin/Editor)
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return next(new ErrorResponse(`Review not found with id ${req.params.reviewId}`, 404));
    }

    // Check if user is the owner or an admin/editor
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'editor') {
      return next(new ErrorResponse('Not authorized to delete this review', 403));
    }

    // The post('deleteOne') hook in Review model should handle updating product's average rating
    await review.deleteOne();

    res.status(200).json({ success: true, message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review (e.g., rating or comment)
// @route   PUT /api/reviews/:reviewId
// @access  Private (Review Owner)
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return next(new ErrorResponse(`Review not found with id ${req.params.reviewId}`, 404));
    }

    // Check if user is the owner
    if (review.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to update this review', 403));
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    // review.username will remain the same

    await review.save(); // This will trigger the post('save') hook

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};
