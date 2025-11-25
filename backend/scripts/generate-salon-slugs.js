/**
 * Migration script to generate slugs for existing salons
 * Run this once to populate slugs for all existing salons
 * 
 * Usage: node backend/scripts/generate-salon-slugs.js
 */

const mongoose = require('mongoose');
const Salon = require('../models/Salon');
const { generateUniqueSlug } = require('../utils/slugGenerator');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const generateSlugsForExistingSalons = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/xaura';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all salons without slugs
    const salonsWithoutSlugs = await Salon.find({ 
      $or: [
        { slug: { $exists: false } },
        { slug: null },
        { slug: '' }
      ]
    });

    console.log(`📊 Found ${salonsWithoutSlugs.length} salons without slugs`);

    let successCount = 0;
    let errorCount = 0;

    for (const salon of salonsWithoutSlugs) {
      try {
        if (!salon.name) {
          console.log(`⚠️  Skipping salon ${salon._id} - no name`);
          continue;
        }

        // Generate unique slug
        const slug = await generateUniqueSlug(salon.name, Salon, salon._id);
        
        // Update salon with slug
        salon.slug = slug;
        await salon.save();
        
        console.log(`✅ Generated slug "${slug}" for salon "${salon.name}" (${salon._id})`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error generating slug for salon ${salon._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📊 Total: ${salonsWithoutSlugs.length}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run migration
generateSlugsForExistingSalons();

