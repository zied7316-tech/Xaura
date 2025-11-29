const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getRevenueTrends,
  getProfitLoss,
  getAnonymousBookingsAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('Owner'), getDashboardAnalytics);
router.get('/revenue-trends', protect, authorize('Owner'), getRevenueTrends);
router.get('/profit-loss', protect, authorize('Owner'), getProfitLoss);
router.get('/anonymous-bookings', protect, authorize('Owner'), getAnonymousBookingsAnalytics);

module.exports = router;

