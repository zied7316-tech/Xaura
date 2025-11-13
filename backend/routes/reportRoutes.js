const express = require('express');
const router = express.Router();
const {
  generatePlatformReport,
  generateFinancialReport,
  generateSalonReport,
  generateUserReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require SuperAdmin access
router.use(protect);
router.use(authorize('SuperAdmin'));

// Report generation routes
router.post('/platform', generatePlatformReport);
router.post('/financial', generateFinancialReport);
router.post('/salon', generateSalonReport);
router.post('/users', generateUserReport);

module.exports = router;

