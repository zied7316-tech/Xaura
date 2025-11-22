const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try multiple possible environment variable names
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      console.error('❌ CRITICAL ERROR: MongoDB connection string not found!');
      console.error('Please set MONGODB_URI environment variable in Railway');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DATABASE')));
      // Don't exit immediately - let server start and show error on requests
      console.error('⚠️  Server will start but database operations will fail until MONGODB_URI is set');
      return Promise.resolve(); // Return resolved promise to not block
    }

    console.log('🔄 Attempting MongoDB connection...');
    console.log('Connection string starts with:', mongoURI.substring(0, 20) + '...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 25000, // 25 second socket timeout (before Railway's 30s)
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      connectTimeoutMS: 10000, // 10 second connection timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return Promise.resolve();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('⚠️  Server will continue but database operations will fail');
    console.error('⚠️  Please check MONGODB_URI in Railway environment variables');
    // Don't exit - let server start and show errors on requests
    return Promise.resolve(); // Return resolved promise to not block server startup
  }
};

module.exports = connectDB;

