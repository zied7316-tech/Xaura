const express = require('express');
const router = express.Router();
const { getBusinessReports } = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Owner-only reports
router.get('/', protect, authorize('Owner'), getBusinessReports);

module.exports = router;
