const twilio = require('twilio');

class SMSService {
  constructor(accountSid, authToken, phoneNumber) {
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
    }
  }

  async sendSMS(to, message) {
    try {
      if (!this.client) {
        console.log('[SMS] Twilio not configured. Would send:', message);
        return {
          success: true,
          message: 'SMS service not configured (test mode)',
          mock: true
        };
      }

      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('[SMS] Error sending SMS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendAppointmentReminder(appointment, reminderSettings) {
    try {
      let message = reminderSettings.sms.template;
      
      // Replace placeholders
      message = message
        .replace('{clientName}', appointment.clientId.name)
        .replace('{service}', appointment.serviceId.name)
        .replace('{time}', new Date(appointment.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        .replace('{date}', new Date(appointment.dateTime).toLocaleDateString())
        .replace('{worker}', appointment.workerId.name)
        .replace('{salon}', appointment.salonId.name);

      return await this.sendSMS(appointment.clientId.phone, message);
    } catch (error) {
      console.error('[SMS] Error sending appointment reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SMSService;




