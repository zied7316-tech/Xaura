const Notification = require('../models/Notification');

/**
 * Mock SMS Service
 * In production, integrate with Twilio or similar
 */
class NotificationService {
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
   * Send WhatsApp notification (MOCK implementation)
   * @param {String} userId - User ID to send notification to
   * @param {String} phoneNumber - Recipient phone number (with country code)
   * @param {String} message - Message content
   * @param {Object} metadata - Additional metadata
   */
  async sendWhatsApp(userId, phoneNumber, message, metadata = {}) {
    try {
      // Create notification record
      const notification = await Notification.create({
        userId,
        type: 'WhatsApp',
        message,
        recipient: phoneNumber,
        status: 'sent', // Mock: immediately mark as sent
        metadata,
        sentAt: new Date()
      });

      // TODO: In production, integrate with WhatsApp Business API
      // const axios = require('axios');
      // await axios.post('https://api.whatsapp.com/send', {
      //   apiKey: process.env.WHATSAPP_API_KEY,
      //   phone: phoneNumber,
      //   message: message
      // });

      console.log(`[MOCK WhatsApp] To: ${phoneNumber}`);
      console.log(`[MOCK WhatsApp] Message: ${message}`);

      return {
        success: true,
        notificationId: notification._id,
        message: 'WhatsApp message sent successfully (mock)'
      };
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
   * Send appointment confirmation notification
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentConfirmation(appointment) {
    const dateStr = new Date(appointment.dateTime).toLocaleString();
    const clientPhone = appointment.clientId.phone;
    const workerPhone = appointment.workerId.phone;
    const salonName = appointment.salonId.name;
    const serviceName = appointment.serviceId.name;

    // Send to client
    const clientMessage = `Your appointment at ${salonName} has been booked!\nService: ${serviceName}\nDate: ${dateStr}\nWorker: ${appointment.workerId.name}`;
    await this.sendSMS(appointment.clientId._id, clientPhone, clientMessage, {
      appointmentId: appointment._id,
      salonId: appointment.salonId._id
    });

    // Send to worker
    const workerMessage = `New appointment scheduled!\nClient: ${appointment.clientId.name}\nService: ${serviceName}\nDate: ${dateStr}`;
    await this.sendSMS(appointment.workerId._id, workerPhone, workerMessage, {
      appointmentId: appointment._id,
      salonId: appointment.salonId._id
    });
  }

  /**
   * Send appointment status update notification
   * @param {Object} appointment - Appointment object with populated fields
   */
  async sendAppointmentStatusUpdate(appointment) {
    const dateStr = new Date(appointment.dateTime).toLocaleString();
    const clientPhone = appointment.clientId.phone;
    const salonName = appointment.salonId.name;
    const serviceName = appointment.serviceId.name;

    let message = '';
    
    switch (appointment.status) {
      case 'confirmed':
        message = `Your appointment at ${salonName} has been confirmed!\nService: ${serviceName}\nDate: ${dateStr}`;
        break;
      case 'cancelled':
        message = `Your appointment at ${salonName} has been cancelled.\nService: ${serviceName}\nDate: ${dateStr}`;
        break;
      case 'completed':
        message = `Thank you for visiting ${salonName}! We hope you enjoyed your ${serviceName}. See you next time!`;
        break;
      default:
        message = `Your appointment status has been updated to: ${appointment.status}`;
    }

    await this.sendSMS(appointment.clientId._id, clientPhone, message, {
      appointmentId: appointment._id,
      salonId: appointment.salonId._id
    });
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

