const express = require('express');
const router = express.Router();
const {
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getMyLoyaltyPoints,
  redeemReward
} = require('../controllers/loyaltyController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owner - Program management
router.get('/program', protect, authorize('Owner'), getLoyaltyProgram);
router.put('/program', protect, authorize('Owner'), updateLoyaltyProgram);

// Client - Points and rewards
router.get('/my-points', protect, authorize('Client'), getMyLoyaltyPoints);
router.post('/redeem', protect, authorize('Client'), redeemReward);

module.exports = router;




