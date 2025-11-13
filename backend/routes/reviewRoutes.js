const express = require('express');
const router = express.Router();
const {
  createReview,
  getWorkerReviews,
  getSalonReviews,
  getMyReviews,
  canReviewAppointment
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (anyone can see reviews)
router.get('/worker/:workerId', getWorkerReviews);
router.get('/salon/:salonId', getSalonReviews);

// Client routes
router.post('/', protect, authorize('Client'), createReview);
router.get('/my-reviews', protect, authorize('Client'), getMyReviews);
router.get('/can-review/:appointmentId', protect, authorize('Client'), canReviewAppointment);

module.exports = router;




