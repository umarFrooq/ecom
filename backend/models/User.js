const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required.'],
    unique: true,
    trim: true,
  },
  email: { // Optional, but good for password recovery or notifications
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email.',
    ],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.'],
    select: false, // Do not return password by default when querying users
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters.']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters.']
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'customer'], // Added 'customer' role
    default: 'customer', // Default new sign-ups to 'customer'
  },
  isActive: { // To disable user accounts
    type: Boolean,
    default: true
  },
  // For customers, could add:
  // phone: { type: String, trim: true },
  // addresses: [AddressSchema] // (If creating a sub-schema for addresses)
  passwordResetToken: String,
  passwordResetExpire: Date,
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId, // Corrected: mongoose.Schema
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1.'],
        default: 1,
      },
      // Storing price here is optional, could fetch from Product on cart load.
      // Storing it can be useful if prices change and you want to honor price at time of adding to cart.
      // For simplicity now, we'll fetch price from Product.
      // name_en: String, // Optional: for quicker display without populating product
      // name_ar: String,
      // image: String, // Optional
    }
  ]
}, {
  timestamps: true,
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Generate a salt
  const salt = await bcrypt.genSalt(10);
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Note: JWT generation is typically handled in auth controllers, not directly in the model.
// However, you could add a method here to sign a JWT if you prefer that pattern,
// but it might make the model less focused.
// Example:
// UserSchema.methods.getSignedJwtToken = function() {
//   return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE || '30d',
//   });
// };

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = require('crypto').randomBytes(20).toString('hex');

  // Hash token and set to passwordResetToken field
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (e.g., 10 minutes)
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken; // Return the unhashed token (to be sent via email)
};

module.exports = mongoose.model('User', UserSchema);
