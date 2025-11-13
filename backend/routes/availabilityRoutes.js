const express = require('express');
const router = express.Router();
const {
  getMyAvailability,
  updateMyAvailability,
  getAvailableWorkers,
  getWorkerTimeSlots
} = require('../controllers/availabilityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Worker routes
router.get('/my-schedule', protect, authorize('Worker'), getMyAvailability);
router.put('/my-schedule', protect, authorize('Worker'), updateMyAvailability);

// Public routes (for booking)
router.get('/salon/:salonId/workers', getAvailableWorkers);
router.get('/worker/:workerId/slots', getWorkerTimeSlots);

module.exports = router;

