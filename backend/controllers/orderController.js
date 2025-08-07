const Order = require('../models/Order');
const Product = require('../models/Product'); // To potentially update stock
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler'); // Custom error class

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Customer)
exports.createOrder = async (req, res, next) => {
  const {
    orderItems, // Array of { product (ID), name_en, name_ar, quantity, price, image }
    shippingAddress, // { address, city, postalCode, country, state, phone }
    paymentMethod, // String
    itemsPrice, // Number
    taxPrice, // Number
    shippingPrice, // Number
    totalPrice, // Number
    // paymentResult will come from payment gateway interaction later
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorResponse('No order items', 400));
  }
  if (!shippingAddress || !paymentMethod || itemsPrice === undefined || totalPrice === undefined) {
    return next(new ErrorResponse('Missing required order fields', 400));
  }

  try {
    // Validate product stock and gather product details for orderItems
    const processedOrderItems = [];
    let calculatedItemsPrice = 0;

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new ErrorResponse(`Product not found: ${item.product}`, 404));
      }
      if (product.stock < item.quantity) {
        return next(new ErrorResponse(`Not enough stock for ${product.name_en}. Requested: ${item.quantity}, Available: ${product.stock}`, 400));
      }
      processedOrderItems.push({
        product: product._id,
        name_en: product.name_en,
        name_ar: product.name_ar,
        quantity: item.quantity,
        price: product.price, // Use current product price
        image: product.images && product.images.length > 0 ? product.images[0] : '',
      });
      calculatedItemsPrice += product.price * item.quantity;
    }

    // Verify client-side prices against calculated server-side prices (optional but good)
    // For simplicity, here we are trusting client's itemsPrice, taxPrice, shippingPrice, totalPrice
    // or recalculating them entirely on the backend. Let's assume client sends them for now.
    // If itemsPrice from client differs significantly from calculatedItemsPrice, could raise an error.

    const order = new Order({
      user: req.user.id,
      orderItems: processedOrderItems, // Use processed items
      shippingAddress,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      totalPrice,
      // isPaid, paidAt will be updated after successful payment
      // orderStatus default is 'Pending'
    });

    const createdOrder = await order.save();

    // TODO: After order creation (and ideally after payment confirmation):
    // 1. Decrease stock for each product in orderItems.
    for (const item of createdOrder.orderItems) {
        try {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
            });
        } catch (stockUpdateError) {
            // This is problematic: order created but stock update failed.
            // Requires compensation logic (e.g. mark order as problematic, notify admin, try to revert)
            // For now, log the error. In a robust system, this needs careful handling.
            console.error(`Failed to update stock for product ${item.product} in order ${createdOrder._id}:`, stockUpdateError);
            // Potentially update order status to something like 'Pending Stock Validation'
        }
    }

    // 2. Clear the user's shopping cart (User model's cart)
    const user = await User.findById(req.user.id);
    if (user) {
        user.cart = [];
        await user.save();
    }

    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Customer who owns order, or Admin)
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'username email firstName lastName' // Populate user details
    );

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Check if the logged-in user is the owner of the order or an admin
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'editor') {
      return next(new ErrorResponse('Not authorized to view this order', 403));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private (Can be called by payment gateway callback or Admin)
exports.updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // In a real scenario, paymentResult would come from the payment gateway
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = { // Mocked payment result
      id: req.body.paymentId || `mock_payment_${Date.now()}`,
      status: req.body.status || 'succeeded',
      update_time: req.body.update_time || Date.now().toString(),
      email_address: req.body.email_address || req.user.email, // Payer's email
    };
    // Potentially change orderStatus here too, e.g., to 'Processing' if it was 'Pending'
    if (order.orderStatus === 'Pending') {
        order.orderStatus = 'Processing';
    }


    const updatedOrder = await order.save();

    // TODO: Send order confirmation email to user.
    // TODO: Notify admin of new paid order.

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private (Admin/Editor)
exports.updateOrderToDelivered = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
    }

    // Ensure order is paid before marking as delivered (optional, business logic dependent)
    if (!order.isPaid) {
        return next(new ErrorResponse('Order is not paid yet', 400));
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'Delivered'; // Update status

    const updatedOrder = await order.save();

    // TODO: Send delivery confirmation email to user.

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/myorders
// @access  Private (Customer)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    if (!orders) {
        return res.status(200).json({ success: true, count: 0, data: [] }); // No orders found
    }
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin/Editor)
exports.getAllOrders = async (req, res, next) => {
  try {
    // TODO: Add pagination, filtering by status, date range etc. for admin view
    const orders = await Order.find({})
      .populate('user', 'id username email firstName lastName') // Populate user details
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (by Admin/Editor)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin/Editor)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { orderStatus } = req.body;

        if (!orderStatus) {
            return next(new ErrorResponse('Order status is required', 400));
        }
        // Validate if the status is one of the allowed enum values
        if (!Order.schema.path('orderStatus').enumValues.includes(orderStatus)) {
            return next(new ErrorResponse(`Invalid order status: ${orderStatus}`, 400));
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
        }

        order.orderStatus = orderStatus;

        // If status is 'Delivered', also update isDelivered and deliveredAt
        if (orderStatus === 'Delivered' && !order.isDelivered) {
            order.isDelivered = true;
            order.deliveredAt = Date.now();
        }
        // If status is 'Cancelled' or 'Failed', consider if isPaid should be affected or stock restored (complex logic)

        const updatedOrder = await order.save();
        res.status(200).json({ success: true, data: updatedOrder });

    } catch (error) {
        next(error);
    }
};
