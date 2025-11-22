/**
 * Database Index Creation Script
 * Run this to create indexes for better query performance
 * 
 * Usage: node scripts/create-indexes.js
 * Or run in MongoDB shell
 */

const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    
    if (!mongoURI) {
      console.error('❌ MongoDB connection string not found!');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Payment indexes
    console.log('📊 Creating Payment indexes...');
    await db.collection('payments').createIndex({ salonId: 1, status: 1, paidAt: -1 });
    await db.collection('payments').createIndex({ salonId: 1, status: 1 });
    await db.collection('payments').createIndex({ clientId: 1, status: 1 });
    console.log('✅ Payment indexes created');

    // Appointment indexes
    console.log('📊 Creating Appointment indexes...');
    await db.collection('appointments').createIndex({ salonId: 1, status: 1, dateTime: -1 });
    await db.collection('appointments').createIndex({ salonId: 1, workerId: 1, status: 1 });
    await db.collection('appointments').createIndex({ clientId: 1, status: 1 });
    await db.collection('appointments').createIndex({ salonId: 1, dateTime: 1 });
    console.log('✅ Appointment indexes created');

    // User indexes
    console.log('📊 Creating User indexes...');
    await db.collection('users').createIndex({ salonId: 1, role: 1 });
    await db.collection('users').createIndex({ email: 1 });
    await db.collection('users').createIndex({ salonId: 1, isActive: 1 });
    console.log('✅ User indexes created');

    // Subscription indexes
    console.log('📊 Creating Subscription indexes...');
    await db.collection('subscriptions').createIndex({ salonId: 1 });
    await db.collection('subscriptions').createIndex({ ownerId: 1 });
    await db.collection('subscriptions').createIndex({ status: 1 });
    console.log('✅ Subscription indexes created');

    // Salon indexes
    console.log('📊 Creating Salon indexes...');
    await db.collection('salons').createIndex({ ownerId: 1 });
    await db.collection('salons').createIndex({ qrCode: 1 });
    console.log('✅ Salon indexes created');

    // Expense indexes
    console.log('📊 Creating Expense indexes...');
    await db.collection('expenses').createIndex({ salonId: 1, date: -1 });
    await db.collection('expenses').createIndex({ salonId: 1, isPaid: 1 });
    console.log('✅ Expense indexes created');

    // Customer indexes
    console.log('📊 Creating Customer indexes...');
    await db.collection('customers').createIndex({ salonId: 1 });
    await db.collection('customers').createIndex({ userId: 1, salonId: 1 });
    console.log('✅ Customer indexes created');

    console.log('\n✅ All indexes created successfully!');
    console.log('📈 Query performance should be significantly improved.\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  }
};

createIndexes();

