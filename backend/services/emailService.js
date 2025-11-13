const nodemailer = require('nodemailer');

class EmailService {
  constructor(config) {
    if (config && config.smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort || 587,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword
        }
      });
      this.fromEmail = config.fromEmail;
      this.fromName = config.fromName || 'Xaura';
    }
  }

  async sendEmail(to, subject, body) {
    try {
      if (!this.transporter) {
        console.log('[EMAIL] Email not configured. Would send:', subject);
        return {
          success: true,
          message: 'Email service not configured (test mode)',
          mock: true
        };
      }

      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject,
        text: body
      });

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('[EMAIL] Error sending email:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendAppointmentReminder(appointment, reminderSettings) {
    try {
      let subject = reminderSettings.email.template.subject;
      let body = reminderSettings.email.template.body;
      
      // Replace placeholders in subject
      subject = subject.replace('{salon}', appointment.salonId.name);

      // Replace placeholders in body
      body = body
        .replace(/{clientName}/g, appointment.clientId.name)
        .replace(/{service}/g, appointment.serviceId.name)
        .replace(/{time}/g, new Date(appointment.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{date}/g, new Date(appointment.dateTime).toLocaleDateString())
        .replace(/{worker}/g, appointment.workerId.name)
        .replace(/{salon}/g, appointment.salonId.name);

      return await this.sendEmail(appointment.clientId.email, subject, body);
    } catch (error) {
      console.error('[EMAIL] Error sending appointment reminder:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;




