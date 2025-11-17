const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    // Use lean() for better performance and handle populate errors gracefully
    const notifications = await Notification.find(query)
      .populate({
        path: 'relatedUser',
        select: 'name avatar',
        strictPopulate: false // Don't throw error if user doesn't exist
      })
      .populate({
        path: 'relatedAppointment',
        select: 'dateTime serviceId status',
        strictPopulate: false // Don't throw error if appointment doesn't exist
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean(); // Convert to plain objects for better performance

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    res.json({
      success: true,
      data: notifications || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Verify ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear all notifications
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
const clearAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ userId });

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notifications as read by appointment ID
 * @route   PUT /api/notifications/appointment/:appointmentId/read
 * @access  Private
 */
const markNotificationsReadByAppointment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.params;

    console.log('Marking notifications as read for appointment:', {
      userId,
      appointmentId,
      appointmentIdType: typeof appointmentId
    });

    // Convert appointmentId to ObjectId if it's a string
    const mongoose = require('mongoose');
    const appointmentObjectId = mongoose.Types.ObjectId.isValid(appointmentId) 
      ? new mongoose.Types.ObjectId(appointmentId)
      : appointmentId;

    // Mark all unread notifications related to this appointment as read
    const result = await Notification.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(userId),
        relatedAppointment: appointmentObjectId,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    console.log('Mark notifications result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Error marking notifications as read by appointment:', error);
    next(error);
  }
};

/**
 * @desc    Register push notification token
 * @route   POST /api/notifications/register-push-token
 * @access  Private
 */
const registerPushToken = async (req, res, next) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if token already exists
    const existingToken = user.pushTokens.find(
      t => t.token === token && t.platform === platform
    );

    if (!existingToken) {
      // Add new token
      user.pushTokens.push({ token, platform });
      await user.save();
    }

    res.json({
      success: true,
      message: 'Push token registered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unregister push notification token
 * @route   DELETE /api/notifications/unregister-push-token
 * @access  Private
 */
const unregisterPushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Push token is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove token
    user.pushTokens = user.pushTokens.filter(t => t.token !== token);
    await user.save();

    res.json({
      success: true,
      message: 'Push token unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to create notification (used by other controllers)
 * Also sends push notification if user has registered tokens
 * Prevents duplicate notifications for the same user, appointment, and type
 * 
 * Rules:
 * - Clients: Only ONE notification ever (even if read) for appointment_confirmed/cancelled
 * - Workers/Owners: Reminders until they accept/reject (only check unread for new_appointment)
 */
const createNotification = async (notificationData) => {
  try {
    // Check for existing notification (only for appointment-related notifications)
    if (notificationData.relatedAppointment && notificationData.type) {
      // Client notifications: Check for ANY notification (read or unread) - only one ever
      // Worker/Owner notifications: Check only unread - they get reminders until action taken
      const isClientNotification = 
        notificationData.type === 'appointment_confirmed' || 
        notificationData.type === 'appointment_cancelled';
      
      // Ensure ObjectId conversion for proper comparison
      const mongoose = require('mongoose');
      
      // Handle userId - could be ObjectId, string, or object with _id
      let userId = notificationData.userId;
      if (userId && typeof userId === 'object' && userId._id) {
        userId = userId._id;
      }
      userId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;
      
      // Handle appointmentId - could be ObjectId, string, or object with _id
      let appointmentId = notificationData.relatedAppointment;
      if (appointmentId && typeof appointmentId === 'object' && appointmentId._id) {
        appointmentId = appointmentId._id;
      }
      appointmentId = mongoose.Types.ObjectId.isValid(appointmentId)
        ? new mongoose.Types.ObjectId(appointmentId)
        : appointmentId;
      
      const query = {
        userId: userId,
        relatedAppointment: appointmentId,
        type: notificationData.type
      };
      
      // For clients: check ANY notification (read or unread) - only one notification ever
      // For workers/owners: check only unread notifications - they get reminders until action
      if (!isClientNotification) {
        query.isRead = false;
      }

      // For clients: Also check if there are any duplicates and delete them
      if (isClientNotification) {
        const allClientNotifications = await Notification.find(query).sort({ createdAt: 1 }); // Sort ascending (oldest first)
        
        if (allClientNotifications.length > 0) {
          // Keep the first (oldest) notification, delete any duplicates
          const oldestNotification = allClientNotifications[0];
          
          if (allClientNotifications.length > 1) {
            // Delete duplicates (keep only the oldest one)
            const duplicateIds = allClientNotifications
              .slice(1) // All except the first (oldest)
              .map(n => n._id);
            
            await Notification.deleteMany({ _id: { $in: duplicateIds } });
            
            console.log('🧹 Cleaned up duplicate client notifications:', {
              userId: userId.toString(),
              type: notificationData.type,
              appointmentId: appointmentId.toString(),
              deletedCount: duplicateIds.length,
              keptNotificationId: oldestNotification._id.toString()
            });
          }
          
          console.log('✅ Duplicate notification prevented (client - only one ever):', {
            userId: userId.toString(),
            type: notificationData.type,
            appointmentId: appointmentId.toString(),
            wasRead: oldestNotification.isRead,
            existingNotificationId: oldestNotification._id.toString()
          });
          
          return oldestNotification;
        }
      } else {
        // For workers/owners: just check for unread
        const existingNotification = await Notification.findOne(query);
        
        if (existingNotification) {
          console.log('✅ Duplicate notification prevented (worker/owner - unread check):', {
            userId: userId.toString(),
            type: notificationData.type,
            appointmentId: appointmentId.toString(),
            wasRead: existingNotification.isRead,
            existingNotificationId: existingNotification._id.toString()
          });
          
          return existingNotification;
        }
      }
      
      console.log('📝 Creating new notification:', {
        userId: userId.toString(),
        type: notificationData.type,
        appointmentId: appointmentId.toString(),
        isClientNotification
      });
    }

    // Create new notification if no duplicate found
    const notification = await Notification.create(notificationData);
    
    // Send push notification if user has registered tokens
    try {
      const pushNotificationService = require('../services/pushNotificationService');
      await pushNotificationService.sendPushNotification(notificationData.userId, {
        title: notificationData.title || 'New Notification',
        body: notificationData.message || '',
        data: {
          notificationId: notification._id.toString(),
          type: notificationData.type || 'general',
          ...notificationData.data
        }
      });
    } catch (pushError) {
      // Don't fail notification creation if push fails
      console.log('Push notification not sent (may not be configured):', pushError.message);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  markNotificationsReadByAppointment,
  registerPushToken,
  unregisterPushToken,
  createNotification
};
