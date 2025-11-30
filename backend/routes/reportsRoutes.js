const express = require('express');
const router = express.Router();
const { getBusinessReports } = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Owner-only reports - requires basicReports
router.get('/', protect, authorize('Owner'), checkSubscriptionFeature('basicReports'), getBusinessReports);

module.exports = router;
