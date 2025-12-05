/**
 * Test WhatsApp Integration
 * Run this script to test if WhatsApp messaging is working with Twilio
 * 
 * Usage: node scripts/testWhatsApp.js <phone_number>
 * Example: node scripts/testWhatsApp.js +1234567890
 */

require('dotenv').config();
const WhatsAppService = require('../services/whatsappService');

async function testWhatsApp() {
  // Get phone number from command line argument
  const phoneNumber = process.argv[2];
  
  if (!phoneNumber) {
    console.error('❌ Please provide a phone number to test with');
    console.log('Usage: node scripts/testWhatsApp.js <phone_number>');
    console.log('Example: node scripts/testWhatsApp.js +216123456789');
    process.exit(1);
  }

  // Check if environment variables are set
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  console.log('🧪 Testing WhatsApp Integration...\n');
  console.log('Configuration:');
  console.log(`  Account SID: ${accountSid ? accountSid.substring(0, 10) + '...' : '❌ NOT SET'}`);
  console.log(`  Auth Token: ${authToken ? authToken.substring(0, 10) + '...' : '❌ NOT SET'}`);
  console.log(`  WhatsApp Number: ${whatsappNumber || '❌ NOT SET'}`);
  console.log(`  Test Phone: ${phoneNumber}\n`);

  if (!accountSid || !authToken || !whatsappNumber) {
    console.error('❌ Error: Twilio credentials not configured in .env file');
    console.log('Please make sure you have set:');
    console.log('  - TWILIO_ACCOUNT_SID');
    console.log('  - TWILIO_AUTH_TOKEN');
    console.log('  - TWILIO_WHATSAPP_NUMBER');
    process.exit(1);
  }

  // Initialize WhatsApp service
  const whatsappService = new WhatsAppService(accountSid, authToken, whatsappNumber);

  // Test message
  const testMessage = `🧪 Test message from Xaura Platform!\n\nThis is a test to verify WhatsApp integration is working correctly. If you received this, your Twilio WhatsApp setup is successful! 🎉`;

  console.log('📤 Sending test message...\n');

  try {
    const result = await whatsappService.sendWhatsApp(phoneNumber, testMessage);

    if (result.success) {
      console.log('✅ SUCCESS! WhatsApp message sent successfully!');
      console.log(`   Message SID: ${result.messageSid}`);
      console.log(`   Status: ${result.status}`);
      console.log(`\n📱 Check your WhatsApp for the message sent to ${phoneNumber}`);
    } else {
      console.error('❌ FAILED to send WhatsApp message');
      console.error(`   Error: ${result.error}`);
      
      if (result.error && result.error.includes('not a valid WhatsApp number')) {
        console.log('\n💡 Tip: Make sure:');
        console.log('   1. You have joined the Twilio WhatsApp sandbox');
        console.log('   2. The phone number is registered with Twilio WhatsApp');
        console.log('   3. You are using a production WhatsApp Business number for non-sandbox numbers');
      }
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  }

  process.exit(result.success ? 0 : 1);
}

testWhatsApp();

