const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const colors = require('colors'); // For console log styling
const connectDB = require('./db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS
// For development, app.use(cors()) is fine.
// For production, restrict to specific origins:
const allowedOrigins = [
  process.env.CUSTOMER_FRONTEND_URL, // e.g., https://www.yourdomain.com
  process.env.ADMIN_FRONTEND_URL     // e.g., https://admin.yourdomain.com
].filter(Boolean); // Filter out undefined values if env vars are not set

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you need to allow cookies or authorization headers
};

if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
  app.use(cors(corsOptions));
  console.log('CORS enabled for production origins:', allowedOrigins.join(', '));
} else {
  app.use(cors()); // More permissive for development
  console.log('CORS enabled for all origins (development mode or no origins specified).');
}


// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Mount routers
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

const projectRoutes = require('./routes/projectRoutes'); // Assuming this was added in a previous step, ensure it's here
app.use('/api/projects', projectRoutes);

const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);

// Upload routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/v1/upload', uploadRoutes); // Using /api/v1 for versioning new routes

// Error Handler Middleware (should be last)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold); // Added colors
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
