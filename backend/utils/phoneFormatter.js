/**
 * Phone Number Formatter Utility for Tunisia
 * Automatically adds Tunisian country code (+216) to phone numbers
 */

/**
 * Format phone number to Tunisian format with country code
 * @param {String} phoneNumber - Raw phone number input
 * @returns {String} - Formatted phone number with +216 prefix (e.g., +21612345678)
 */
function formatTunisianPhone(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return null;
  }

  // Remove all whitespace, dashes, dots, and parentheses
  let cleaned = phoneNumber.trim().replace(/[\s\-\(\)\.]/g, '');

  // Remove whatsapp: prefix if present
  if (cleaned.toLowerCase().startsWith('whatsapp:')) {
    cleaned = cleaned.substring(9);
  }

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Remove leading 00 (international dialing code)
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // If number already starts with 216 (country code without +)
  if (cleaned.startsWith('216')) {
    // Remove the 216 prefix
    cleaned = cleaned.substring(3);
  }

  // Remove leading 0 if present (local format)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Validate that we have digits only and reasonable length (8 digits for Tunisia)
  if (!/^\d{8}$/.test(cleaned)) {
    console.warn(`[PhoneFormatter] Invalid Tunisian phone number format: ${phoneNumber} (cleaned: ${cleaned})`);
    // Return original if we can't format properly, but try to add +216 anyway
    // This handles edge cases where number might be in different format
    if (cleaned.length >= 8 && cleaned.length <= 10 && /^\d+$/.test(cleaned)) {
      // Take last 8 digits
      cleaned = cleaned.slice(-8);
    } else {
      return phoneNumber; // Return original if can't format
    }
  }

  // Add Tunisian country code
  return `+216${cleaned}`;
}

/**
 * Validate if phone number looks like a valid Tunisian number
 * @param {String} phoneNumber - Phone number to validate
 * @returns {Boolean} - True if valid Tunisian format
 */
function isValidTunisianPhone(phoneNumber) {
  if (!phoneNumber) return false;
  
  const formatted = formatTunisianPhone(phoneNumber);
  if (!formatted) return false;
  
  // Should be +216 followed by 8 digits
  return /^\+216\d{8}$/.test(formatted);
}

/**
 * Format phone number and ensure it has whatsapp: prefix for Twilio
 * @param {String} phoneNumber - Phone number to format
 * @returns {String} - Formatted with whatsapp: prefix (e.g., whatsapp:+21612345678)
 */
function formatForWhatsApp(phoneNumber) {
  const formatted = formatTunisianPhone(phoneNumber);
  if (!formatted) return phoneNumber;
  
  // Remove any existing whatsapp: prefix
  let result = formatted;
  if (result.startsWith('whatsapp:')) {
    result = result.substring(9);
  }
  
  // Add whatsapp: prefix for Twilio
  return `whatsapp:${result}`;
}

module.exports = {
  formatTunisianPhone,
  isValidTunisianPhone,
  formatForWhatsApp
};

