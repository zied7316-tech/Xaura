const express = require('express');
const router = express.Router();
const {
  createRecurringAppointment,
  getRecurringAppointments,
  cancelRecurring,
  createGroupBooking,
  getGroupBookings
} = require('../controllers/advancedBookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Recurring Appointments
router.post('/recurring', protect, authorize('Client'), createRecurringAppointment);
router.get('/recurring', protect, authorize('Client'), getRecurringAppointments);
router.delete('/recurring/:id', protect, authorize('Client'), cancelRecurring);

// Group Bookings
router.post('/group', protect, authorize('Client'), createGroupBooking);
router.get('/group', protect, authorize('Client'), getGroupBookings);

module.exports = router;




