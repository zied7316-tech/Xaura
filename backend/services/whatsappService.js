const twilio = require('twilio');

class WhatsAppService {
  constructor(accountSid, authToken, whatsappNumber) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.whatsappNumber = whatsappNumber; // Format: 'whatsapp:+14155238886'
    
    // Validate credentials
    if (!accountSid || !authToken) {
      console.warn('[WhatsApp] Twilio credentials not provided. WhatsApp messages will not be sent.');
      this.client = null;
      return;
    }

    if (!whatsappNumber) {
      console.warn('[WhatsApp] TWILIO_WHATSAPP_NUMBER not provided. WhatsApp messages will not be sent.');
      this.client = null;
      return;
    }

    // Initialize Twilio client
    try {
      this.client = twilio(accountSid, authToken);
      console.log('[WhatsApp] Twilio client initialized successfully');
      console.log('[WhatsApp] WhatsApp number:', whatsappNumber ? whatsappNumber.substring(0, 20) + '...' : 'NOT SET');
    } catch (error) {
      console.error('[WhatsApp] Failed to initialize Twilio client:', error.message);
      this.client = null;
    }
  }

  async sendWhatsApp(to, message) {
    try {
      // Check if Twilio is configured
      if (!this.client) {
        const reason = !this.accountSid || !this.authToken 
          ? 'Twilio credentials not configured'
          : !this.whatsappNumber 
            ? 'TWILIO_WHATSAPP_NUMBER not configured'
            : 'Twilio client initialization failed';
        
        console.warn('[WhatsApp] Service not available:', reason);
        console.log('[WhatsApp] Would send to:', to, 'Message:', message.substring(0, 50) + '...');
        
        return {
          success: false,
          mock: true,
          error: reason
        };
      }

      // Validate 'from' number
      if (!this.whatsappNumber) {
        console.error('[WhatsApp] TWILIO_WHATSAPP_NUMBER is not set');
        return {
          success: false,
          error: 'TWILIO_WHATSAPP_NUMBER environment variable is not set'
        };
      }

      // Validate 'to' number
      if (!to || typeof to !== 'string' || to.trim() === '') {
        console.error('[WhatsApp] Invalid recipient phone number:', to);
        return {
          success: false,
          error: 'Invalid recipient phone number'
        };
      }

      // Format phone number with whatsapp: prefix
      let formattedTo = to.trim();

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

      console.log('[WhatsApp] Sending message:', {
        from: this.whatsappNumber,
        to: formattedTo,
        messageLength: message.length
      });

      const result = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber, // Format: 'whatsapp:+14155238886'
        to: formattedTo
      });

      console.log('[WhatsApp] ✅ Message sent successfully:', {
        sid: result.sid,
        status: result.status,
        to: formattedTo
      });

      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };
    } catch (error) {
      // Enhanced error logging
      console.error('[WhatsApp] ❌ Error sending message:', {
        error: error.message,
        code: error.code,
        status: error.status,
        to: to,
        from: this.whatsappNumber
      });

      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.code === 21211) {
        errorMessage = 'Invalid recipient phone number format';
      } else if (error.code === 21608 || error.message.includes('Channel')) {
        errorMessage = 'TWILIO_WHATSAPP_NUMBER is not configured correctly. Check your Twilio Console -> Messaging -> Try it out -> Send a WhatsApp message for the correct number format.';
      } else if (error.code === 20003) {
        errorMessage = 'Twilio authentication failed. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.';
      }

      return {
        success: false,
        error: errorMessage,
        errorCode: error.code
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

