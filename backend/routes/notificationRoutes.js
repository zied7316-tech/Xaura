const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  registerPushToken,
  unregisterPushToken
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// Get notifications
router.get('/', protect, getNotifications);

// Mark as read
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllAsRead);

// Delete
router.delete('/:id', protect, deleteNotification);
router.delete('/clear-all', protect, clearAllNotifications);

// Push notification tokens
router.post('/register-push-token', protect, registerPushToken);
router.delete('/unregister-push-token', protect, unregisterPushToken);

module.exports = router;

