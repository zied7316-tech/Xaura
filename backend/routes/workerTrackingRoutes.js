const express = require('express');
const router = express.Router();
const {
  getTrackingSettings,
  updateTrackingSettings,
  reportLocation
} = require('../controllers/workerTrackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owner routes - configure tracking settings
router.get('/settings', protect, authorize('Owner'), getTrackingSettings);
router.put('/settings', protect, authorize('Owner'), updateTrackingSettings);

// Worker route - report location/WiFi
router.post('/report', protect, authorize('Worker'), reportLocation);

module.exports = router;

