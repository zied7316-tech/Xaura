const express = require('express');
const router = express.Router();
const {
  getTrackingSettings,
  updateTrackingSettings,
  reportLocation,
  getMySalonTrackingSettings
} = require('../controllers/workerTrackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owner routes - configure tracking settings
router.get('/settings', protect, authorize('Owner'), getTrackingSettings);
router.put('/settings', protect, authorize('Owner'), updateTrackingSettings);

// Worker routes - check tracking settings and report location/WiFi
router.get('/my-salon-settings', protect, authorize('Worker'), getMySalonTrackingSettings);
router.post('/report', protect, authorize('Worker'), reportLocation);

module.exports = router;

