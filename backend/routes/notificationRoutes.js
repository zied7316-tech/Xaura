const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  markNotificationsReadByAppointment,
  registerPushToken,
  unregisterPushToken
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get notifications
router.get('/', protect, getNotifications);

// Mark as read - specific routes first (order matters!)
router.put('/appointment/:appointmentId/read', protect, markNotificationsReadByAppointment);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

// Delete
router.delete('/:id', protect, deleteNotification);
router.delete('/clear-all', protect, clearAllNotifications);

// Push notification tokens
router.post('/register-push-token', protect, registerPushToken);
router.delete('/unregister-push-token', protect, unregisterPushToken);

module.exports = router;

