const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is here
require('dotenv').config();

// Protect routes: Verify token and attach user to request object
let protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Else check for token in cookies (if you're using cookie-based auth)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user details but exclude password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

// Grant access to specific roles
let authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) { // req.user should be set by 'protect' middleware
        return res.status(403).json({ success: false, message: 'User role not available. Ensure protect middleware runs first.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ // 403 Forbidden
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};
// Specific middleware for admin role
const admin = authorize('admin');

module.exports = {
  protect,
  authorize,
  admin, // Export admin middleware
};