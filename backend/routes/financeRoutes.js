const express = require('express');
const router = express.Router();
const {
  getFinanceDashboard
} = require('../controllers/financeDashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Finance dashboard routes - require fullFinanceSystem
router.get('/dashboard', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getFinanceDashboard);

module.exports = router;

