// @desc    Webhook controller
// @route   POST /api/webhooks/payment-notification
// @access  Public
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');

exports.handlePaymentWebhook = async (req, res, next) => {
    const event = req.body;
    const signature = req.headers['checkout-signature']; // Example for checkout.com

    // TODO: Verify the webhook signature to ensure it's from a trusted source
    // This is a critical security step. Each payment gateway will have its own
    // way of handling this. For now, we'll skip this for demonstration purposes.

    try {
        // Assume the webhook payload contains information to identify the order
        // and the payment status. This will vary between gateways.
        const { orderId, transactionId, status } = parseWebhookEvent(event);

        if (status === 'succeeded') {
            const order = await Order.findById(orderId);

            if (order && !order.isPaid) {
                order.isPaid = true;
                order.paidAt = Date.now();
                order.paymentResult = {
                    id: transactionId,
                    status: status,
                    update_time: Date.now().toString(),
                    email_address: order.user.email, // This might not be available, need to check
                };
                order.orderStatus = 'Processing';

                // Decrease stock
                for (const item of order.orderItems) {
                    await Product.findByIdAndUpdate(item.product, {
                        $inc: { stock: -item.quantity },
                    });
                }

                // Clear user's cart
                const user = await User.findById(order.user);
                if (user) {
                    user.cart = [];
                    await user.save();
                }

                await order.save();

                // TODO: Send order confirmation email
            }
        } else {
            // Handle other event types (e.g., 'failed', 'pending')
            const order = await Order.findById(orderId);
            if (order) {
                order.orderStatus = 'Failed';
                await order.save();
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        // If anything goes wrong, send an error response but don't crash the server
        console.error('Webhook Error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

// This is a placeholder function. The actual implementation will depend on the
// specific structure of the webhook events from each payment gateway.
function parseWebhookEvent(event) {
    // This function will need to have logic to differentiate between
    // checkout.com, easypaisa, and jazzcash webhooks.
    // For now, we'll assume a generic structure.
    return {
        orderId: event.data.object.metadata.orderId,
        transactionId: event.data.object.id,
        status: event.data.object.status,
    };
}
