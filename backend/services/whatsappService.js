const twilio = require('twilio');

class WhatsAppService {
  constructor(accountSid, authToken, whatsappNumber) {
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.whatsappNumber = whatsappNumber; // Format: 'whatsapp:+14155238886'
    }
  }

  async sendWhatsApp(to, message) {
    try {
      if (!this.client) {
        console.log('[WhatsApp] Twilio not configured. Would send:', message);
        return {
          success: true,
          message: 'WhatsApp service not configured (test mode)',
          mock: true
        };
      }

      // Format phone number with whatsapp: prefix
      let formattedTo = to;
      
      // Remove any existing whatsapp: prefix to normalize
      if (formattedTo.startsWith('whatsapp:')) {
        formattedTo = formattedTo.replace('whatsapp:', '');
      }
      
      // Remove leading + if present (will add it back)
      if (formattedTo.startsWith('+')) {
        formattedTo = formattedTo.substring(1);
      }
      
      // Add whatsapp: prefix and ensure country code is present
      formattedTo = `whatsapp:+${formattedTo}`;

      const result = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber, // Format: 'whatsapp:+14155238886'
        to: formattedTo
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendAppointmentReminder(appointment, reminderSettings) {
    try {
      // Use WhatsApp template if available, fallback to SMS template
      let message = reminderSettings.whatsapp?.template || reminderSettings.sms?.template;
      
      if (!message) {
        // Default template if none provided
        message = `Reminder: You have an appointment at {salon}\nService: {service}\nDate: {date} at {time}\nWorker: {worker}`;
      }
      
      // Replace placeholders
      message = message
        .replace('{clientName}', appointment.clientId.name)
        .replace('{service}', appointment.serviceId.name)
        .replace('{time}', new Date(appointment.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        .replace('{date}', new Date(appointment.dateTime).toLocaleDateString())
        .replace('{worker}', appointment.workerId.name)
        .replace('{salon}', appointment.salonId.name);

      return await this.sendWhatsApp(appointment.clientId.phone, message);
    } catch (error) {
      console.error('[WhatsApp] Error sending appointment reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = WhatsAppService;

