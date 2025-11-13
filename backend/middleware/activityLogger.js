const ActivityLog = require('../models/ActivityLog');

/**
 * Middleware to automatically log Super Admin activities
 * Usage: Add after the action is successful
 */
const logActivity = (action, targetType = null) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send to log after successful response
    res.send = function (data) {
      // Only log if response was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Don't wait for logging to complete
        createActivityLog(req, action, targetType).catch((err) => {
          console.error('Error logging activity:', err);
        });
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Manual function to log activities
 * Use this when you need more control
 */
const createActivityLog = async (req, action, targetType = null, targetId = null, targetName = null, details = {}, status = 'success') => {
  try {
    // Only log Super Admin actions
    if (!req.user || req.user.role !== 'SuperAdmin') {
      return;
    }

    const logData = {
      admin: req.user._id,
      action,
      status,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Add target information if provided
    if (targetType) {
      logData.targetType = targetType;
    }

    if (targetId) {
      logData.targetId = targetId;
    }

    if (targetName) {
      logData.targetName = targetName;
    }

    // Add details if provided
    if (details && Object.keys(details).length > 0) {
      logData.details = details;
    }

    // Create log entry
    await ActivityLog.create(logData);
  } catch (error) {
    // Silently fail - don't break the main action if logging fails
    console.error('Failed to create activity log:', error);
  }
};

/**
 * Helper to extract target info from request
 */
const getTargetInfo = (req, targetType) => {
  const targetId = req.params.id || req.params.userId || req.params.salonId;
  let targetName = null;

  // Try to get name from request body or response data
  if (req.body?.name) {
    targetName = req.body.name;
  } else if (req.body?.email) {
    targetName = req.body.email;
  }

  return { targetId, targetName };
};

module.exports = {
  logActivity,
  createActivityLog,
  getTargetInfo,
};


