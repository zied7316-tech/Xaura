const EmailService = require('./emailService');

// Initialize global email service from environment variables
const globalEmailConfig = {
  smtpHost: process.env.EMAIL_HOST,
  smtpPort: parseInt(process.env.EMAIL_PORT) || 587,
  smtpUser: process.env.EMAIL_USER,
  smtpPassword: process.env.EMAIL_PASS,
  fromEmail: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  fromName: process.env.EMAIL_FROM_NAME || 'Xaura'
};

// Create global email service instance
const globalEmailService = new EmailService(globalEmailConfig);

module.exports = globalEmailService;


