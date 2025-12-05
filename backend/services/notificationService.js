const Notification = require('../models/Notification');
const WhatsAppService = require('./whatsappService');

/**
 * Notification Service
 * Handles SMS and WhatsApp notifications via Twilio
 */
class NotificationService {
  constructor() {
    // Initialize WhatsApp service with Twilio credentials
    this.whatsappService = new WhatsAppService(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
      process.env.TWILIO_WHATSAPP_NUMBER // Format: 'whatsapp:+14155238886'
    );
  }
  /**
   * Send SMS notification (MOCK implementation)
   * @param {String} userId - User ID to send notification to
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message content
   * @param {Object} metadata - Additional metadata (appointmentId, salonId, etc.)
   */
  async sendSMS(userId, phoneNumber, message, metadata = {}) {
    try {
      // Create notification record
      const notification = await Notification.create({
        userId,
        type: 'SMS',
        message,
        recipient: phoneNumber,
        status: 'sent', // Mock: immediately mark as sent
        metadata,
        sentAt: new Date()
      });

      // TODO: In production, integrate with Twilio
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phoneNumber
      // });

      console.log(`[MOCK SMS] To: ${phoneNumber}`);
      console.log(`[MOCK SMS] Message: ${message}`);

      return {
        success: true,
        notificationId: notification._id,
        message: 'SMS sent successfully (mock)'
      };
    } catch (error) {
      // Log failed notification
      await Notification.create({
        userId,
        type: 'SMS',
        message,
        recipient: phoneNumber,
        status: 'failed',
        metadata,
        errorMessage: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send WhatsApp notification using Twilio
   * @param {String} userId - User ID to send notification to
   * @param {String} phoneNumber - Recipient phone number (with country code)
   * @param {String} message - Message content
   * @param {Object} metadata - Additional metadata
   */
  async sendWhatsApp(userId, phoneNumber, message, metadata = {}) {
    try {
      // Validate phone number
      if (!phoneNumber) {
        console.error('[NotificationService] sendWhatsApp: Phone number is missing');
        return {
          success: false,
          error: 'Phone number is required'
        };
      }

      // Log attempt
      console.log('[NotificationService] Sending WhatsApp to:', phoneNumber);
      console.log('[NotificationService] Message preview:', message.substring(0, 50) + '...');

      // Send WhatsApp via Twilio
      const result = await this.whatsappService.sendWhatsApp(phoneNumber, message);

      // Log result
      if (result.success) {
        console.log('[NotificationService] ✅ WhatsApp sent successfully:', {
          phoneNumber,
          messageSid: result.messageSid,
          status: result.status
        });
      } else {
        console.error('[NotificationService] ❌ WhatsApp send failed:', {
          phoneNumber,
          error: result.error
        });
      }

      // Note: We don't create Notification records for WhatsApp messages
      // The Notification model is for in-app notifications only
      // WhatsApp messages are tracked via Twilio logs

      return {
        success: result.success,
        messageSid: result.messageSid,
        status: result.status,
        message: result.mock 
          ? 'WhatsApp message sent successfully (test mode)' 
          : result.success 
            ? 'WhatsApp message sent successfully' 
            : 'Failed to send WhatsApp message',
        error: result.error || null
      };
    } catch (error) {
      console.error('[NotificationService] Exception sending WhatsApp:', {
        phoneNumber,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send appointment confirmation notification via WhatsApp
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentConfirmation(appointment) {
    try {
      // Validate appointment has required fields
      if (!appointment || !appointment.clientId || !appointment.workerId || !appointment.salonId || !appointment.serviceId) {
        console.error('[NotificationService] sendAppointmentConfirmation: Appointment missing required fields');
        return;
      }

      const dateStr = new Date(appointment.dateTime).toLocaleString();
      const clientPhone = appointment.clientId.phone;
      const workerPhone = appointment.workerId.phone;
      const salonName = appointment.salonId.name;
      const serviceName = appointment.serviceId.name;

      // Validate phone numbers exist
      if (!clientPhone) {
        console.error('[NotificationService] Client phone number missing for appointment:', appointment._id);
      }
      if (!workerPhone) {
        console.error('[NotificationService] Worker phone number missing for appointment:', appointment._id);
      }

      // Send WhatsApp to client
      if (clientPhone) {
        const clientMessage = `Your appointment at ${salonName} has been booked!\nService: ${serviceName}\nDate: ${dateStr}\nWorker: ${appointment.workerId.name}`;
        const clientResult = await this.sendWhatsApp(
          appointment.clientId._id || appointment.clientId,
          clientPhone,
          clientMessage,
          {
            appointmentId: appointment._id,
            salonId: appointment.salonId._id || appointment.salonId
          }
        );
        
        if (!clientResult.success) {
          console.error('[NotificationService] Failed to send WhatsApp to client:', clientResult.error);
        }
      } else {
        console.warn('[NotificationService] Skipping client WhatsApp - no phone number');
      }

      // Send WhatsApp to worker
      if (workerPhone) {
        const workerMessage = `New appointment scheduled!\nClient: ${appointment.clientId.name}\nService: ${serviceName}\nDate: ${dateStr}`;
        const workerResult = await this.sendWhatsApp(
          appointment.workerId._id || appointment.workerId,
          workerPhone,
          workerMessage,
          {
            appointmentId: appointment._id,
            salonId: appointment.salonId._id || appointment.salonId
          }
        );
        
        if (!workerResult.success) {
          console.error('[NotificationService] Failed to send WhatsApp to worker:', workerResult.error);
        }
      } else {
        console.warn('[NotificationService] Skipping worker WhatsApp - no phone number');
      }
    } catch (error) {
      console.error('[NotificationService] Exception in sendAppointmentConfirmation:', error);
      // Don't throw - allow appointment creation to succeed even if notifications fail
    }
  }

  /**
   * Send appointment status update notification via WhatsApp
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentStatusUpdate(appointment) {
    try {
      // Validate appointment has required fields
      if (!appointment || !appointment.clientId || !appointment.salonId || !appointment.serviceId) {
        console.error('[NotificationService] sendAppointmentStatusUpdate: Appointment missing required fields');
        return;
      }

      const dateStr = new Date(appointment.dateTime).toLocaleString();
      const clientPhone = appointment.clientId.phone;
      const salonName = appointment.salonId.name;
      const serviceName = appointment.serviceId.name;

      // Validate phone number exists
      if (!clientPhone) {
        console.error('[NotificationService] Client phone number missing for status update:', appointment._id);
        return;
      }

      let message = '';
      
      switch (appointment.status) {
        case 'Confirmed':
        case 'confirmed':
          message = `Your appointment at ${salonName} has been confirmed!\nService: ${serviceName}\nDate: ${dateStr}`;
          break;
        case 'Cancelled':
        case 'cancelled':
          message = `Your appointment at ${salonName} has been cancelled.\nService: ${serviceName}\nDate: ${dateStr}`;
          break;
        case 'Completed':
        case 'completed':
          message = `Thank you for visiting ${salonName}! We hope you enjoyed your ${serviceName}. See you next time!`;
          break;
        default:
          message = `Your appointment status has been updated to: ${appointment.status}`;
      }

      const result = await this.sendWhatsApp(
        appointment.clientId._id || appointment.clientId,
        clientPhone,
        message,
        {
          appointmentId: appointment._id,
          salonId: appointment.salonId._id || appointment.salonId
        }
      );

      if (!result.success) {
        console.error('[NotificationService] Failed to send WhatsApp status update:', result.error);
      }
    } catch (error) {
      console.error('[NotificationService] Exception in sendAppointmentStatusUpdate:', error);
      // Don't throw - allow appointment status update to succeed even if notification fails
    }
  }

  /**
   * Send appointment reminder (for scheduled tasks)
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentReminder(appointment) {
    const dateStr = new Date(appointment.dateTime).toLocaleString();
    const clientPhone = appointment.clientId.phone;
    const salonName = appointment.salonId.name;
    const serviceName = appointment.serviceId.name;

    const message = `Reminder: You have an appointment tomorrow at ${salonName}\nService: ${serviceName}\nTime: ${dateStr}\nSee you soon!`;

    await this.sendSMS(appointment.clientId._id, clientPhone, message, {
      appointmentId: appointment._id,
      salonId: appointment.salonId._id,
      additionalInfo: { type: 'reminder' }
    });
  }
}

module.exports = new NotificationService();

