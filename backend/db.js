const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  const mongoUri = process.env.NODE_ENV === 'test'
    ? process.env.MONGO_URI_TEST
    : process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MONGO_URI not found. Please set it in your .env file or ensure MONGO_URI_TEST is set for test environment.'.red.bold);
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, { // Use the determined URI
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false, // Not needed for Mongoose 6+
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
