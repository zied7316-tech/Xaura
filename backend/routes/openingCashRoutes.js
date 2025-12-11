const express = require('express');
const router = express.Router();
const {
  getOpeningCash,
  setOpeningCash,
  getOpeningCashHistory
} = require('../controllers/openingCashController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Opening cash routes - require fullFinanceSystem
router.get('/', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getOpeningCash);
router.post('/', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), setOpeningCash);
router.get('/history', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getOpeningCashHistory);

module.exports = router;

