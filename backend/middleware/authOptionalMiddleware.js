const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Optional Protection: Verify token if present, attach user, but don't fail if no token
exports.protectOptional = async (req, res, next) => {
  let token;
  req.user = null; // Initialize req.user to null

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Else check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Fetch user details but exclude password
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user; // Set req.user if token is valid and user exists
      }
    } catch (err) {
      // Token is invalid or expired, but we don't block the request.
      // req.user remains null.
      console.log('Optional protect: Invalid or expired token, proceeding as anonymous.');
    }
  }
  next(); // Always proceed
};
