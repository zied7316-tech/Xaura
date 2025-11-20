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

// Check if email is configured
const isEmailConfigured = () => {
  return !!(globalEmailConfig.smtpHost && globalEmailConfig.smtpUser && globalEmailConfig.smtpPassword);
};

// Log email configuration status
if (!isEmailConfigured()) {
  console.warn('[EMAIL] ⚠️  Email service is NOT configured!');
  console.warn('[EMAIL] To enable email sending, set these environment variables:');
  console.warn('[EMAIL]   - EMAIL_HOST (e.g., smtp.gmail.com)');
  console.warn('[EMAIL]   - EMAIL_PORT (e.g., 587)');
  console.warn('[EMAIL]   - EMAIL_USER (your email address)');
  console.warn('[EMAIL]   - EMAIL_PASS (your email password or app password)');
  console.warn('[EMAIL]   - EMAIL_FROM (sender email, optional)');
  console.warn('[EMAIL]   - EMAIL_FROM_NAME (sender name, optional)');
} else {
  console.log('[EMAIL] ✅ Email service configured');
  console.log(`[EMAIL] Host: ${globalEmailConfig.smtpHost}:${globalEmailConfig.smtpPort}`);
  console.log(`[EMAIL] From: ${globalEmailConfig.fromName} <${globalEmailConfig.fromEmail}>`);
}

// Create global email service instance
const globalEmailService = new EmailService(globalEmailConfig);

// Export with configuration check helper
module.exports = globalEmailService;
module.exports.isEmailConfigured = isEmailConfigured;


