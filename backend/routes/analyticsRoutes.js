const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getRevenueTrends,
  getProfitLoss
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, authorize('Owner'), getDashboardAnalytics);
router.get('/revenue-trends', protect, authorize('Owner'), getRevenueTrends);
router.get('/profit-loss', protect, authorize('Owner'), getProfitLoss);

module.exports = router;

