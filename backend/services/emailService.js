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

  /**
   * Get base HTML template
   */
  getBaseTemplate(content, title = 'Xaura') {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Xaura</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Salon Management Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © ${new Date().getFullYear()} Xaura. All rights reserved.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Send email with HTML support
   */
  async sendEmail(to, subject, body, isHTML = false) {
    try {
      if (!this.transporter) {
        console.log('[EMAIL] Email not configured. Would send:', subject);
        return {
          success: true,
          message: 'Email service not configured (test mode)',
          mock: true
        };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: to,
        subject: subject
      };

      if (isHTML) {
        mailOptions.html = body;
        // Also include plain text version
        mailOptions.text = body.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n');
      } else {
        mailOptions.text = body;
      }

      const info = await this.transporter.sendMail(mailOptions);

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

  /**
   * Send email verification email
   */
  async sendVerificationEmail(user, verificationToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    const content = `
      <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi ${user.name},
      </p>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Thank you for signing up for Xaura! Please verify your email address to complete your registration.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Verify Email Address
        </a>
      </div>
      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
        ${verificationUrl}
      </p>
      <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    `;

    const htmlBody = this.getBaseTemplate(content, 'Verify Your Email - Xaura');
    return await this.sendEmail(user.email, 'Verify Your Email Address - Xaura', htmlBody, true);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const content = `
      <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi ${user.name},
      </p>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        You requested to reset your password. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 8px 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
        ${resetUrl}
      </p>
      <p style="margin: 20px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
      </p>
    `;

    const htmlBody = this.getBaseTemplate(content, 'Reset Your Password - Xaura');
    return await this.sendEmail(user.email, 'Reset Your Password - Xaura', htmlBody, true);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const roleMessages = {
      Client: {
        title: 'Welcome to Xaura!',
        content: `
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            You're all set! Start discovering amazing salons and booking appointments.
          </p>
          <ul style="margin: 0 0 20px; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
            <li>🔍 Search and discover salons near you</li>
            <li>📅 Book appointments with your favorite barbers</li>
            <li>💬 Chat directly with workers</li>
            <li>🎁 Earn loyalty points and rewards</li>
            <li>⭐ Leave reviews and ratings</li>
          </ul>
        `
      },
      Worker: {
        title: 'Welcome to Xaura!',
        content: `
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your salon owner will add you to their team soon. Once added, you can:
          </p>
          <ul style="margin: 0 0 20px; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
            <li>📅 Manage your appointment calendar</li>
            <li>⏰ Set your availability</li>
            <li>💬 Chat with clients</li>
            <li>💰 Track your earnings and commissions</li>
            <li>📊 View your performance analytics</li>
          </ul>
        `
      },
      Owner: {
        title: 'Welcome to Xaura!',
        content: `
          <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
            You're ready to start managing your salon! Here's what you can do:
          </p>
          <ul style="margin: 0 0 20px; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
            <li>🏪 Create and manage your salon profile</li>
            <li>👥 Add workers to your team</li>
            <li>✂️ Set up your services and pricing</li>
            <li>📅 Manage appointments and bookings</li>
            <li>💰 Track finances and generate reports</li>
            <li>📦 Manage inventory</li>
            <li>🎁 Set up loyalty programs</li>
          </ul>
        `
      }
    };

    const roleInfo = roleMessages[user.role] || roleMessages.Client;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const dashboardUrl = `${frontendUrl}/${user.role.toLowerCase()}/dashboard`;

    const content = `
      <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">${roleInfo.title}</h2>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Hi ${user.name},
      </p>
      <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
        Welcome to Xaura! We're excited to have you on board.
      </p>
      ${roleInfo.content}
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Go to Dashboard
        </a>
      </div>
      <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you have any questions, feel free to reach out to our support team.
      </p>
    `;

    const htmlBody = this.getBaseTemplate(content, 'Welcome to Xaura');
    return await this.sendEmail(user.email, 'Welcome to Xaura! 🎉', htmlBody, true);
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




