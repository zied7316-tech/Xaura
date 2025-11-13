const express = require('express');
const router = express.Router();
const {
  getActivityLogs,
  getActivityStats,
  getActivityLog,
  exportActivityLogs,
  deleteActivityLog,
  clearOldLogs,
} = require('../controllers/activityLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require SuperAdmin access
router.use(protect);
router.use(authorize('SuperAdmin'));

// Routes
router.get('/', getActivityLogs);
router.get('/stats', getActivityStats);
router.get('/export', exportActivityLogs);
router.post('/clear-old', clearOldLogs);
router.get('/:id', getActivityLog);
router.delete('/:id', deleteActivityLog);

module.exports = router;

