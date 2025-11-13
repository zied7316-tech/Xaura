const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-platform');
    console.log('✅ Connected to MongoDB\n');

    const admin = await User.findOne({ role: 'SuperAdmin' });
    
    if (admin) {
      console.log('✅ Super Admin Found!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('👑 Role:', admin.role);
      console.log('📅 Created:', admin.createdAt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('🌐 Login at: http://localhost:3000/login');
      console.log('   Email: ' + admin.email);
      console.log('   Password: SuperAdmin123!\n');
    } else {
      console.log('❌ No Super Admin found in database');
      console.log('   Run: node scripts/createSuperAdmin.js\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkSuperAdmin();




