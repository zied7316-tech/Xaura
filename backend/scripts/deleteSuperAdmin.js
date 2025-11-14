const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Script to delete a Super Admin by email
 * Run: node scripts/deleteSuperAdmin.js <email>
 * Example: node scripts/deleteSuperAdmin.js superadmin@salon.com
 */

const deleteSuperAdmin = async () => {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log('\n❌ Error: Please provide an email address');
      console.log('Usage: node scripts/deleteSuperAdmin.js <email>');
      console.log('Example: node scripts/deleteSuperAdmin.js superadmin@salon.com\n');
      process.exit(1);
    }

    // Connect to database
    console.log('\n🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beauty-platform');
    console.log('✅ Connected to MongoDB\n');

    // Find the super admin
    const superAdmin = await User.findOne({ 
      email: email.toLowerCase(),
      role: 'super-admin'
    });

    if (!superAdmin) {
      console.log(`❌ No Super Admin found with email: ${email}`);
      console.log('\n💡 Make sure:');
      console.log('   - The email is correct');
      console.log('   - The user has super-admin role\n');
      process.exit(1);
    }

    // Show details and confirm
    console.log('⚠️  Found Super Admin:');
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.name);
    console.log('   Role:', superAdmin.role);
    console.log('\n🗑️  Deleting Super Admin...');

    // Delete
    await User.findByIdAndDelete(superAdmin._id);

    console.log('\n✅ SUCCESS! Super Admin deleted!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Deleted:', email);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error deleting Super Admin:', error.message);
    process.exit(1);
  }
};

deleteSuperAdmin();

