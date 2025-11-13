const express = require('express');
const router = express.Router();
const {
  closeTheDay,
  getDayClosureHistory,
  getDayClosure
} = require('../controllers/dayClosureController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/close', protect, authorize('Owner'), closeTheDay);
router.get('/history', protect, authorize('Owner'), getDayClosureHistory);
router.get('/:date', protect, authorize('Owner'), getDayClosure);

module.exports = router;

