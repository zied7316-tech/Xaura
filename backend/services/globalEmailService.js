const EmailService = require('./emailService');

// Initialize global email service from environment variables
// Priority: Resend API (recommended) > SMTP (fallback)
const globalEmailConfig = {
  // Resend API (recommended - works on Railway)
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  fromName: process.env.EMAIL_FROM_NAME || 'Xaura',
  
  // SMTP (fallback - may not work on Railway)
  smtpHost: process.env.EMAIL_HOST,
  smtpPort: parseInt(process.env.EMAIL_PORT) || 587,
  smtpUser: process.env.EMAIL_USER,
  smtpPassword: process.env.EMAIL_PASS
};

// Check if email is configured
const isEmailConfigured = () => {
  // Check Resend first (recommended)
  if (globalEmailConfig.resendApiKey) {
    return true;
  }
  // Fallback to SMTP
  return !!(globalEmailConfig.smtpHost && globalEmailConfig.smtpUser && globalEmailConfig.smtpPassword);
};

// Log email configuration status
if (!isEmailConfigured()) {
  console.warn('[EMAIL] ⚠️  Email service is NOT configured!');
  console.warn('[EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('[EMAIL] RECOMMENDED: Use Resend API (works on Railway, no SMTP needed)');
  console.warn('[EMAIL] Set this environment variable in Railway:');
  console.warn('[EMAIL]   - RESEND_API_KEY=re_xxxxxxxxxxxxx');
  console.warn('[EMAIL]   - EMAIL_FROM=noreply@yourdomain.com (or use onboarding@resend.dev)');
  console.warn('[EMAIL]   - EMAIL_FROM_NAME=Xaura (optional)');
  console.warn('[EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('[EMAIL] ALTERNATIVE: Use SMTP (may not work on Railway)');
  console.warn('[EMAIL]   - EMAIL_HOST (e.g., smtp.gmail.com)');
  console.warn('[EMAIL]   - EMAIL_PORT (e.g., 587)');
  console.warn('[EMAIL]   - EMAIL_USER (your email address)');
  console.warn('[EMAIL]   - EMAIL_PASS (your email password or app password)');
  console.warn('[EMAIL] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('[EMAIL] 📖 Setup guide: See RESEND_SETUP.md');
} else {
  if (globalEmailConfig.resendApiKey) {
    console.log('[EMAIL] ✅ Email service configured (Resend API)');
    console.log(`[EMAIL] From: ${globalEmailConfig.fromName} <${globalEmailConfig.fromEmail}>`);
  } else {
    console.log('[EMAIL] ✅ Email service configured (SMTP)');
    console.log(`[EMAIL] Host: ${globalEmailConfig.smtpHost}:${globalEmailConfig.smtpPort}`);
    console.log(`[EMAIL] From: ${globalEmailConfig.fromName} <${globalEmailConfig.fromEmail || globalEmailConfig.smtpUser}>`);
  }
}

// Create global email service instance
const globalEmailService = new EmailService(globalEmailConfig);

// Export with configuration check helper
module.exports = globalEmailService;
module.exports.isEmailConfigured = isEmailConfigured;


