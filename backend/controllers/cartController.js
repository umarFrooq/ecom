const User = require('../models/User');
const Product = require('../models/Product');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (Customer)
exports.getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'cart.product',
      select: 'name_en name_ar price images stock slug_en slug_ar averageRating numReviews', // Select fields needed for cart display
      populate: { path: 'category', select: 'name_en name_ar' } // Optionally populate product's category
    });

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Filter out items where product might have been deleted but still in cart (though unlikely with good data hygiene)
    const validCartItems = user.cart.filter(item => item.product !== null);
    if (validCartItems.length !== user.cart.length) {
        // Optionally, update user's cart to remove null product items
        user.cart = validCartItems;
        await user.save({ validateBeforeSave: false }); // No need to validate user model here
    }

    res.status(200).json({ success: true, data: validCartItems });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or update quantity
// @route   POST /api/cart
// @access  Private (Customer)
exports.addItemToCart = async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.user.id;

  if (!productId || quantity < 1) {
    return next(new ErrorResponse('Please provide product ID and a valid quantity (>=1).', 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse('User not found', 404));

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return next(new ErrorResponse('Product not found or not available', 404));
    if (product.stock < quantity) return next(new ErrorResponse('Not enough product in stock', 400));

    const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);

    if (cartItemIndex > -1) {
      // Product already in cart, update quantity
      user.cart[cartItemIndex].quantity += quantity;
      if (user.cart[cartItemIndex].quantity > product.stock) {
         // If adding more than stock, cap at stock, or throw error earlier
         // For simplicity, let's assume frontend validates this or we cap it here.
         // Or, for a more robust check:
         // const newQuantity = user.cart[cartItemIndex].quantity + quantity;
         // if (newQuantity > product.stock) return next(new ErrorResponse(`Cannot add ${quantity} more. Only ${product.stock - user.cart[cartItemIndex].quantity} available.`, 400));
         // user.cart[cartItemIndex].quantity = newQuantity;
         user.cart[cartItemIndex].quantity = Math.min(user.cart[cartItemIndex].quantity, product.stock); // Cap at stock
      }
    } else {
      // Product not in cart, add new item
      user.cart.push({ product: productId, quantity });
    }

    await user.save(); // This will validate the user model, including cart item quantities (min:1)

    // Repopulate for response
    const updatedUser = await User.findById(userId).populate('cart.product', 'name_en name_ar price images stock slug_en slug_ar');
    res.status(200).json({ success: true, data: updatedUser.cart.filter(item => item.product !== null) });

  } catch (error) {
    next(error);
  }
};

// @desc    Update item quantity in cart
// @route   PUT /api/cart/item/:productId  (Using productId in URL for clarity)
// @access  Private (Customer)
exports.updateCartItemQuantity = async (req, res, next) => {
  const { quantity } = req.body;
  const { productId } = req.params;
  const userId = req.user.id;

  if (quantity === undefined || quantity < 0) { // Allow 0 to remove, or handle removal separately
    return next(new ErrorResponse('Please provide a valid quantity (>=0).', 400));
  }

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse('User not found', 404));

    const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productId);

    if (cartItemIndex === -1) {
      return next(new ErrorResponse('Item not found in cart', 404));
    }

    if (quantity === 0) { // If quantity is 0, remove item
      user.cart.splice(cartItemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product || !product.isActive) return next(new ErrorResponse('Product not found or not available', 404));
      if (product.stock < quantity) return next(new ErrorResponse(`Not enough stock. Only ${product.stock} available.`, 400));
      user.cart[cartItemIndex].quantity = quantity;
    }

    await user.save();
    const updatedUser = await User.findById(userId).populate('cart.product', 'name_en name_ar price images stock slug_en slug_ar');
    res.status(200).json({ success: true, data: updatedUser.cart.filter(item => item.product !== null) });

  } catch (error) {
    next(error);
  }
};


// @desc    Remove item from cart
// @route   DELETE /api/cart/item/:productId
// @access  Private (Customer)
exports.removeCartItem = async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse('User not found', 404));

    const initialCartLength = user.cart.length;
    user.cart = user.cart.filter(item => item.product.toString() !== productId);

    if (user.cart.length === initialCartLength) {
      return next(new ErrorResponse('Item not found in cart to remove', 404));
    }

    await user.save();
    const updatedUser = await User.findById(userId).populate('cart.product', 'name_en name_ar price images stock slug_en slug_ar');
    res.status(200).json({ success: true, data: updatedUser.cart.filter(item => item.product !== null) });

  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private (Customer)
exports.clearCart = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorResponse('User not found', 404));

    user.cart = [];
    await user.save();

    res.status(200).json({ success: true, message: 'Cart cleared successfully', data: [] });
  } catch (error) {
    next(error);
  }
};
