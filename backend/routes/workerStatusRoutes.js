const express = require('express');
const router = express.Router();
const {
  getMyStatus,
  toggleStatus,
  getSalonWorkersStatus,
  getWorkerAnalytics,
  getSalonAnalytics
} = require('../controllers/workerStatusController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Worker routes
router.get('/my-status', protect, authorize('Worker'), getMyStatus);
router.put('/toggle', protect, authorize('Worker'), toggleStatus);

// Owner routes
router.get('/salon/:salonId', protect, authorize('Owner'), getSalonWorkersStatus);
router.get('/analytics/salon', protect, authorize('Owner'), getSalonAnalytics);
router.get('/analytics/worker/:workerId', protect, authorize('Owner'), getWorkerAnalytics);

module.exports = router;

