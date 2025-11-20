const express = require('express');
const router = express.Router();
const {
  getMySubscription,
  confirmTrial,
  requestPlanUpgrade,
  getAvailablePlans,
  purchaseSmsCredits,
  purchasePixelTracking
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require Owner authentication
router.use(protect);
router.use(authorize('Owner'));

// Get owner's subscription
router.get('/', getMySubscription);

// Get available plans and add-ons
router.get('/plans', getAvailablePlans);

// Trial confirmation (at day 15)
router.post('/confirm-trial', confirmTrial);

// Request plan upgrade (cash payment)
router.post('/request-upgrade', requestPlanUpgrade);

// Purchase SMS credits
router.post('/sms-credits/purchase', purchaseSmsCredits);

// Purchase Pixel Tracking add-on
router.post('/pixel-tracking/purchase', purchasePixelTracking);

module.exports = router;

