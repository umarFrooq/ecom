// Default mock user for authenticated routes
const mockUser = {
  _id: '60f7eabc1234567890abcdef', // Example ObjectId
  id: '60f7eabc1234567890abcdef',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin', // Default to admin for broad access in tests
  // Add other fields your controllers/services might expect from req.user
};

// Mock for 'protect' middleware
const protect = jest.fn((req, res, next) => {
  req.user = mockUser; // Attach the mock user to the request
  next();
});

// Mock for 'authorize' middleware
// This mock will always allow access for simplicity in many tests.
// For specific role tests, you might adjust req.user.role or make this mock more sophisticated.
const authorize = (...roles) => jest.fn((req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    next();
  } else if (req.user && roles.length === 0) { // If authorize() is called with no roles, just check if user exists
    next();
  } else if (!req.user && roles.includes('public')) { // Special case for optional auth where public is allowed
    next();
  }
  // else {
  //   // Simulate forbidden if needed for specific tests, though often we test the "allow" path.
  //   // For most unit/integration tests of controllers, we assume authorization passes if protect does.
  //   // res.status(403).json({ success: false, message: 'Mock Forbidden' });
  // }
  next(); // Default to allow for most tests unless specific role testing is needed
});


// Mock for 'protectOptional' middleware
const protectOptional = jest.fn((req, res, next) => {
    // Simulate that sometimes a user might be present, sometimes not.
    // For deterministic tests, you might set req.user based on a test-specific condition.
    // For now, let's assume it behaves like 'protect' and sets a user for testing protected aspects.
    // Or, set req.user = null if you want to test the "no user" path.
    // To test both paths, tests would need to configure this mock.
    // Let's default to setting a user to test logic that uses req.user.
    req.user = mockUser;
    // req.user = null; // To test the public path
    next();
});


module.exports = {
  protect,
  authorize,
  protectOptional,
  mockUser // Export mockUser if needed in test files to set expectations
};
