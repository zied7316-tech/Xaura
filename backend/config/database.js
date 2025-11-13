const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Try multiple possible environment variable names
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      console.error('❌ CRITICAL ERROR: MongoDB connection string not found!');
      console.error('Please set MONGODB_URI environment variable in Railway');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DATABASE')));
      process.exit(1);
    }

    console.log('🔄 Attempting MongoDB connection...');
    console.log('Connection string starts with:', mongoURI.substring(0, 20) + '...');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

