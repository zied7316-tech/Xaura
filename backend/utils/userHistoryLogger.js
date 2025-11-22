const UserHistory = require('../models/UserHistory');

/**
 * Log user activity to history
 * @param {Object} params - History log parameters
 * @param {String} params.userId - User ID
 * @param {String} params.userRole - User role (Owner, Worker, Client)
 * @param {String} params.action - Action type
 * @param {String} params.description - Human-readable description
 * @param {Object} params.relatedEntity - Related entity info {type, id, name}
 * @param {Object} params.metadata - Additional metadata
 * @param {Object} params.req - Express request object (optional, for IP/UA)
 */
const logUserHistory = async ({
  userId,
  userRole,
  action,
  description,
  relatedEntity = null,
  metadata = {},
  req = null
}) => {
  try {
    const historyData = {
      userId,
      userRole,
      action,
      description,
      metadata
    };

    if (relatedEntity) {
      historyData.relatedEntity = relatedEntity;
    }

    if (req) {
      historyData.ipAddress = req.ip || req.connection?.remoteAddress;
      historyData.userAgent = req.get('user-agent');
    }

    await UserHistory.create(historyData);
  } catch (error) {
    // Silently fail - don't break the main action if logging fails
    console.error('Failed to log user history:', error);
  }
};

module.exports = { logUserHistory };

