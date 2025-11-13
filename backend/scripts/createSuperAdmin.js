const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to create the first Super Admin account
 * Run: node scripts/createSuperAdmin.js
 */

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-platform');
    console.log('✅ Connected to MongoDB');

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'SuperAdmin' });
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log('\n💡 If you want to create a new Super Admin, delete the existing one first.');
      process.exit(0);
    }

    // Super Admin credentials (you can change these)
    const superAdminData = {
      email: 'admin@xaura.com',
      password: 'SuperAdmin123!',
      name: 'Xaura Admin',
      phone: '+1234567890',
      role: 'SuperAdmin'
    };

    // Create Super Admin
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
    const superAdmin = await User.create({
      ...superAdminData,
      password: hashedPassword
    });

    console.log('\n🎉 Super Admin Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Password:', superAdminData.password);
    console.log('👤 Name:', superAdminData.name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('🌐 Login at: http://localhost:3000/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();




