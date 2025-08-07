const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name_en: { type: String, required: true }, // Store at time of order
  name_ar: { type: String, required: true }, // Store at time of order
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1.'],
    default: 1,
  },
  price: { // Price per unit at the time of order
    type: Number,
    required: true,
  },
  image: { type: String } // Main image of the product at time of order
});

const ShippingAddressSchema = new Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  // Optional: state, phone for shipping
  state: { type: String },
  phone: { type: String },
});

const PaymentResultSchema = new Schema({
  id: { type: String }, // Transaction ID from payment provider
  status: { type: String }, // e.g., 'succeeded', 'pending', 'failed'
  update_time: { type: String }, // Time of last update from payment provider
  email_address: { type: String }, // Payer's email from payment provider
});

const OrderSchema = new Schema(
  {
    user: { // Customer who placed the order
      type: Schema.Types.ObjectId,
      ref: 'User', // Assuming customers will also be Users with a 'customer' role
      required: true,
    },
    orderItems: [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    // billingAddress: BillingAddressSchema, // Optional, if different from shipping
    paymentMethod: { // e.g., 'Credit Card', 'PayPal', 'Cash on Delivery'
      type: String,
      required: true,
    },
    paymentResult: PaymentResultSchema,
    itemsPrice: { // Subtotal of items
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: { // Tax amount
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: { // Cost of shipping
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: { // Grand total
      type: Number,
      required: true,
      default: 0.0,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Failed'],
      default: 'Pending',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    // Optional: trackingNumber, notes from customer
    trackingNumber: { type: String },
    customerNotes: { type: String }
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Indexing for frequent queries by admin or customer
OrderSchema.index({ user: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', OrderSchema);
