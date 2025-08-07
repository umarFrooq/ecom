const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongoServer;

mongoose.set('strictQuery', true);

beforeAll(async () => {
  if (process.env.SKIP_MONGO_SETUP === 'true') {
    console.log('Skipping MongoDB Memory Server setup.');
    return;
  }

  jest.setTimeout(90000); // Increased timeout
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGO_URI_TEST = mongoUri;

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // console.log(`Mock MongoDB connected at: ${mongoUri}`);
  } catch (error) {
    console.error("Error setting up in-memory MongoDB:", error);
    process.exit(1);
  }
});

beforeEach(async () => {
  if (process.env.SKIP_MONGO_SETUP === 'true') {
    return;
  }
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    // console.error("Error clearing collections:", error);
  }
});

afterAll(async () => {
  if (process.env.SKIP_MONGO_SETUP === 'true') {
    return;
  }
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    // console.log('Mock MongoDB disconnected and server stopped.');
  } catch (error) {
    // console.error("Error stopping/disconnecting in-memory MongoDB:", error);
  }
});
