const express = require('express');
const router = express.Router();
const {
  getReminderSettings,
  updateReminderSettings,
  sendManualReminder,
  getPendingReminders,
  testReminderConfig
} = require('../controllers/reminderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Settings
router.get('/settings', protect, authorize('Owner'), getReminderSettings);
router.put('/settings', protect, authorize('Owner'), updateReminderSettings);

// Send reminders
router.post('/send/:appointmentId', protect, authorize('Owner', 'Worker'), sendManualReminder);
router.get('/pending', protect, authorize('Owner'), getPendingReminders);

// Test configuration
router.post('/test', protect, authorize('Owner'), testReminderConfig);

module.exports = router;




