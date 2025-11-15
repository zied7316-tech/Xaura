const crypto = require('crypto');

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Hex encoded token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate email verification token
 * @returns {string} - Hex encoded token
 */
const generateEmailVerificationToken = () => {
  return generateToken(32);
};

/**
 * Generate password reset token
 * @returns {string} - Hex encoded token
 */
const generatePasswordResetToken = () => {
  return generateToken(32);
};

/**
 * Hash a token using SHA256
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken
};


