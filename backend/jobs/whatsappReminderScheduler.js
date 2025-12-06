const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const notificationService = require('../services/notificationService');

/**
 * Send WhatsApp reminders 1 hour before appointments
 * Runs every 5 minutes to check for appointments needing reminders
 */
const checkAndSendReminders = async () => {
  try {
    console.log('[WhatsApp Reminder Scheduler] Checking for appointments needing reminders...');
    
    const now = new Date();
    // Calculate 1 hour from now (with 5-minute window: 55-65 minutes ahead)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const fiveMinutesAhead = new Date(now.getTime() + 55 * 60 * 1000);
    const fiveMinutesAfter = new Date(now.getTime() + 65 * 60 * 1000);
    
    // Find appointments that:
    // 1. Are confirmed
    // 2. Are scheduled between 55-65 minutes from now (1 hour window with buffer)
    // 3. Haven't had a reminder sent yet
    // 4. Have a client with a phone number
    const appointments = await Appointment.find({
      status: 'Confirmed',
      dateTime: {
        $gte: fiveMinutesAhead,
        $lte: fiveMinutesAfter
      },
      whatsappReminderSent: false,
      clientId: { $ne: null }
    })
    .populate('clientId', 'name phone')
    .populate('workerId', 'name')
    .populate('serviceId', 'name')
    .populate('salonId', 'name');
    
    if (appointments.length === 0) {
      console.log('[WhatsApp Reminder Scheduler] No appointments need reminders at this time');
      return;
    }
    
    console.log(`[WhatsApp Reminder Scheduler] Found ${appointments.length} appointment(s) needing reminders`);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const appointment of appointments) {
      // Skip if client doesn't have phone number
      if (!appointment.clientId || !appointment.clientId.phone) {
        console.warn(`[WhatsApp Reminder Scheduler] Skipping appointment ${appointment._id} - no client phone number`);
        continue;
      }
      
      try {
        // Send WhatsApp reminder
        const result = await notificationService.sendAppointmentReminder(appointment);
        
        if (result.success) {
          // Mark reminder as sent
          appointment.whatsappReminderSent = true;
          appointment.whatsappReminderSentAt = new Date();
          await appointment.save();
          
          sentCount++;
          console.log(`[WhatsApp Reminder Scheduler] ✅ Sent reminder for appointment ${appointment._id} (${appointment.clientId.name})`);
        } else {
          failedCount++;
          console.error(`[WhatsApp Reminder Scheduler] ❌ Failed to send reminder for appointment ${appointment._id}:`, result.error);
        }
      } catch (error) {
        failedCount++;
        console.error(`[WhatsApp Reminder Scheduler] ❌ Error sending reminder for appointment ${appointment._id}:`, error.message);
      }
    }
    
    console.log(`[WhatsApp Reminder Scheduler] Completed: ${sentCount} sent, ${failedCount} failed`);
  } catch (error) {
    console.error('[WhatsApp Reminder Scheduler] Error in reminder check:', error);
  }
};

// Run every 5 minutes
cron.schedule('*/5 * * * *', checkAndSendReminders);

// Also run at startup (with delay to let server fully initialize)
setTimeout(() => {
  console.log('[WhatsApp Reminder Scheduler] Running initial reminder check...');
  checkAndSendReminders();
}, 15000); // 15 seconds after server starts

module.exports = { checkAndSendReminders };

