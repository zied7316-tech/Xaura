const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const testPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-platform');
    console.log('✅ Connected to MongoDB\n');

    // Get Super Admin with password field
    const admin = await User.findOne({ role: 'SuperAdmin' }).select('+password');
    
    if (!admin) {
      console.log('❌ No Super Admin found');
      process.exit(1);
    }

    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔐 Password Hash:', admin.password.substring(0, 30) + '...');
    console.log('');

    // Test the password
    const testPassword = 'SuperAdmin123!';
    console.log('🧪 Testing password:', testPassword);
    
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    if (isMatch) {
      console.log('✅ PASSWORD MATCHES! Login should work!');
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH!');
      console.log('');
      console.log('🔧 Let me try to fix it...');
      
      // Hash the correct password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', salt);
      
      // Update directly in database
      await User.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('✅ Password updated! Try logging in again.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

testPassword();




