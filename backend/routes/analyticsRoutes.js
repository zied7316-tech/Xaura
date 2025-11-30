const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getRevenueTrends,
  getProfitLoss,
  getAnonymousBookingsAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Basic dashboard - available in all plans
router.get('/dashboard', protect, authorize('Owner'), checkSubscriptionFeature('basicDashboard'), getDashboardAnalytics);

// Advanced analytics - Pro and Enterprise only
router.get('/revenue-trends', protect, authorize('Owner'), checkSubscriptionFeature('advancedAnalytics'), getRevenueTrends);
router.get('/profit-loss', protect, authorize('Owner'), checkSubscriptionFeature('advancedAnalytics'), getProfitLoss);
router.get('/anonymous-bookings', protect, authorize('Owner'), checkSubscriptionFeature('basicDashboard'), getAnonymousBookingsAnalytics);

module.exports = router;

