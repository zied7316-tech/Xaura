const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
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

module.exports = router;

