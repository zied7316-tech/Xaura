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
      // Send WhatsApp via Twilio
      const result = await this.whatsappService.sendWhatsApp(phoneNumber, message);

      // Create notification record
      const notification = await Notification.create({
        userId,
        type: 'WhatsApp',
        message,
        recipient: phoneNumber,
        status: result.success ? 'sent' : 'failed',
        metadata,
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null
      });

      if (result.success) {
        return {
          success: true,
          notificationId: notification._id,
          messageSid: result.messageSid,
          message: result.mock 
            ? 'WhatsApp message sent successfully (test mode)' 
            : 'WhatsApp message sent successfully'
        };
      } else {
        return {
          success: false,
          notificationId: notification._id,
          error: result.error
        };
      }
    } catch (error) {
      // Log failed notification
      await Notification.create({
        userId,
        type: 'WhatsApp',
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
   * Send appointment confirmation notification via WhatsApp
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentConfirmation(appointment) {
    const dateStr = new Date(appointment.dateTime).toLocaleString();
    const clientPhone = appointment.clientId.phone;
    const workerPhone = appointment.workerId.phone;
    const salonName = appointment.salonId.name;
    const serviceName = appointment.serviceId.name;

    // Send WhatsApp to client
    const clientMessage = `Your appointment at ${salonName} has been booked!\nService: ${serviceName}\nDate: ${dateStr}\nWorker: ${appointment.workerId.name}`;
    try {
      await this.sendWhatsApp(appointment.clientId._id, clientPhone, clientMessage, {
        appointmentId: appointment._id,
        salonId: appointment.salonId._id
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send WhatsApp to client:', error);
      // Continue to try sending to worker even if client message fails
    }

    // Send WhatsApp to worker
    const workerMessage = `New appointment scheduled!\nClient: ${appointment.clientId.name}\nService: ${serviceName}\nDate: ${dateStr}`;
    try {
      await this.sendWhatsApp(appointment.workerId._id, workerPhone, workerMessage, {
        appointmentId: appointment._id,
        salonId: appointment.salonId._id
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send WhatsApp to worker:', error);
      // Don't throw - allow appointment creation to succeed even if notifications fail
    }
  }

  /**
   * Send appointment status update notification via WhatsApp
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentStatusUpdate(appointment) {
    const dateStr = new Date(appointment.dateTime).toLocaleString();
    const clientPhone = appointment.clientId.phone;
    const salonName = appointment.salonId.name;
    const serviceName = appointment.serviceId.name;

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

    try {
      await this.sendWhatsApp(appointment.clientId._id, clientPhone, message, {
        appointmentId: appointment._id,
        salonId: appointment.salonId._id
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send WhatsApp status update:', error);
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

