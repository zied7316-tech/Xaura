const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');
const User = require('../models/User');
require('dotenv').config();

/**
 * Interactive script to create YOUR Super Admin account
 * Run: node scripts/createYourSuperAdmin.js
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  try {
    console.log('\n🎉 Welcome to Xaura Super Admin Setup!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Connect to database
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-platform');
    console.log('✅ Connected to MongoDB\n');

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    if (existingSuperAdmin) {
      console.log('⚠️  A Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}\n`);
      
      const replace = await question('Do you want to DELETE the existing one and create a new one? (yes/no): ');
      if (replace.toLowerCase() === 'yes' || replace.toLowerCase() === 'y') {
        await User.findByIdAndDelete(existingSuperAdmin._id);
        console.log('✅ Existing Super Admin deleted!\n');
      } else {
        console.log('❌ Cancelled. Existing Super Admin kept.');
        rl.close();
        process.exit(0);
      }
    }

    // Get user input
    console.log('Please enter YOUR details:\n');
    const name = await question('👤 Your Full Name: ');
    const email = await question('📧 Your Email: ');
    const password = await question('🔑 Your Password (min 8 characters): ');
    const phone = await question('📱 Your Phone (optional): ');

    // Validate
    if (!name || !email || !password) {
      console.log('\n❌ Error: Name, email, and password are required!');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.log('\n❌ Error: Password must be at least 8 characters!');
      rl.close();
      process.exit(1);
    }

    // Create Super Admin
    console.log('\n🔄 Creating your Super Admin account...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const superAdmin = await User.create({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || undefined,
      role: 'super-admin',
      isActive: true
    });

    console.log('\n✅ SUCCESS! Your Super Admin account is created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🌐 Login at: https://xaura-production-fd43.up.railway.app/login');
    console.log('\n💡 Save these credentials in a safe place!\n');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating Super Admin:', error.message);
    rl.close();
    process.exit(1);
  }
};

createSuperAdmin();

