const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // To access JWT_SECRET
const sendEmail = require('../utils/sendEmail'); // Import the email utility
const crypto = require('crypto');
// @desc    Login admin user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password.' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password'); // Explicitly select password

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials (password mismatch).' });
    }

    // User is valid, create token
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all users (for Admin)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    // TODO: Add pagination, search by username/email, filter by role if needed
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }); // Exclude passwords

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}
 // For hashing reset token in resetPassword

// ... (other controller functions like loginAdmin, registerUser, getMe, updateUserDetails) ...

// @desc    Forgot password - Get reset token
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.'});
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Important: Don't reveal if user doesn't exist for security reasons
      // Still send a 200 OK to prevent email enumeration.
      return res.status(200).json({ success: true, message: 'If your email is registered, you will receive a password reset link.' });
    }

    // Get reset token (unhashed version from the model method)
    const resetToken = user.getResetPasswordToken(); // This method also sets hashed token and expiry on user model
    await user.save({ validateBeforeSave: false }); // Save token and expiry to DB

    // Create reset URL for the frontend
    // This should ideally come from an environment variable for frontend base URL
    const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000'; // Fallback for local dev
    const resetUrl = `${frontendBaseUrl}/account/reset-password/${resetToken}`;

    const messageBody = `
      You are receiving this email because you (or someone else) has requested the reset of a password for your account.
      Please click on the link below, or paste it into your browser to complete the process within 10 minutes of receiving it:
      \n\n
      ${resetUrl}
      \n\n
      If you did not request this, please ignore this email and your password will remain unchanged.
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: messageBody,
      });

      res.status(200).json({ success: true, message: 'Password reset link has been sent to your email.' });
    } catch (err) {
      console.error('Email sending error in forgotPassword:', err);
      // Clear the reset token fields if email sending fails, so user can try again
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      await user.save({ validateBeforeSave: false });
      // Return a generic error to the user
      return res.status(500).json({ success: false, message: 'There was an error sending the password reset email. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot Password Controller Error:', error);
    // Avoid leaking specific error details to the client
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get reset token from URL param
    const resetTokenFromUrl = req.params.resettoken;

    // Hash the token from URL to compare with the stored hashed token
    const hashedToken = crypto // Use the imported crypto
      .createHash('sha256')
      .update(resetTokenFromUrl)
      .digest('hex');

    // Find user by the hashed token and check if token has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    // Set new password
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: 'Please provide a new password.' });
    }

    user.password = password; // pre-save hook will hash it
    user.passwordResetToken = undefined; // Clear the token
    user.passwordResetExpire = undefined; // Clear expiry
    await user.save();

    // Send token response (log them in)
    sendTokenResponse(user, 200, res);

  } catch (error) {
     if (error.name === 'ValidationError') { // e.g. password too short
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private (to be implemented with auth middleware)
exports.getMe = async (req, res) => {
  try {
    // req.user will be set by the auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Ensure only relevant roles can access if needed, though middleware should handle this.
    // For example, if only 'admin' or 'editor' roles from User model are allowed for admin panel.
    // if(!['admin', 'editor'].includes(user.role)) {
    //    return res.status(403).json({ success: false, message: 'User role not authorized for this resource.' });
    // }


    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update user details for the logged-in user
// @route   PUT /api/auth/me/details
// @access  Private
exports.updateUserDetails = async (req, res, next) => {
  try {
    const userId = req.user.id; // From protect middleware
    const { firstName, lastName, username, email } = req.body;

    // Fields to update
    const fieldsToUpdate = {};
    if (firstName !== undefined) fieldsToUpdate.firstName = firstName;
    if (lastName !== undefined) fieldsToUpdate.lastName = lastName;

    // Handle username change - check for uniqueness if changed
    if (username !== undefined && username !== req.user.username) {
      const existingUserByUsername = await User.findOne({ username });
      if (existingUserByUsername && existingUserByUsername._id.toString() !== userId) {
        return res.status(400).json({ success: false, message: 'Username is already taken.' });
      }
      fieldsToUpdate.username = username;
    }

    // Handle email change - check for uniqueness if changed
    // For production, changing email usually involves a verification step for the new email.
    if (email !== undefined && email !== req.user.email) {
      const existingUserByEmail = await User.findOne({ email });
      if (existingUserByEmail && existingUserByEmail._id.toString() !== userId) {
        return res.status(400).json({ success: false, message: 'Email is already taken.' });
      }
      fieldsToUpdate.email = email;
      // TODO: Add email verification flow if this were a production system
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
        return res.status(400).json({ success: false, message: 'No details provided for update.' });
    }

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true, // Return the updated document
      runValidators: true, // Run Mongoose validators on update
    }).select('-password'); // Exclude password from result

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, data: user });

  } catch (error) {
    // Handle Mongoose validation errors (e.g., maxlength)
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    // Handle duplicate key errors if not caught by the initial checks
    if (error.code === 11000) {
        let field = 'field';
        if (error.keyValue.username) field = 'username';
        if (error.keyValue.email) field = 'email';
        return res.status(400).json({ success: false, message: `This ${field} is already taken.` });
    }
    console.error('Update User Details Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// @desc    Register a new user (customer by default)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username, email, and password.' });
    }

    // Check if user already exists (by email or username)
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      let message = 'User already exists.';
      if (user.email === email) message = 'User with this email already exists.';
      if (user.username === username) message = 'User with this username already exists.';
      return res.status(400).json({ success: false, message });
    }

    // Create user (role defaults to 'customer' as per User model)
    user = await User.create({
      username,
      email,
      password, // Will be hashed by pre-save hook
      firstName,
      lastName,
    });

    // User created, send token response (log them in directly)
    sendTokenResponse(user, 201, res);

  } catch (error) {
    // Handle Mongoose validation errors (e.g., password too short)
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    // Handle duplicate key errors if not caught by the initial check (should be rare if check is robust)
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate field value entered. User might already exist.' });
    }
    console.error('Register User Error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};


// Helper function to create JWT, set cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d', // e.g., '30d', '1h'
  });

  const options = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || 30) * 24 * 60 * 60 * 1000) // Cookie expiry
    ),
    httpOnly: true, // Cookie cannot be accessed by client-side scripts
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true; // Only send cookie over HTTPS in production
  }

  res
    .status(statusCode)
    .cookie('token', token, options) // Set cookie (optional, can also just send token in response body)
    .json({
      success: true,
      token, // Also send token in response body for flexibility
      user: { // Send some user details
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
      }
    });
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private (User needs to be logged in to log out)
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // expire in 10 seconds
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};
