const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAvailableTimeSlots
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Validation rules - allow either serviceId (single) or services (multiple)
const createAppointmentValidation = [
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('dateTime').isISO8601().withMessage('Valid date and time is required'),
  // serviceId is optional (for backward compatibility with single service)
  body('serviceId').optional(),
  // services array is optional (for multiple services)
  body('services').optional().isArray().withMessage('Services must be an array if provided')
];

const updateStatusValidation = [
  body('status').isIn(['confirmed', 'completed', 'cancelled']).withMessage('Invalid status')
];

// Public route - get available slots
router.get('/available-slots', getAvailableTimeSlots);

// Protected routes
router.post('/', protect, authorize('Client', 'Owner'), createAppointmentValidation, createAppointment);
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, updateStatusValidation, updateAppointmentStatus);

module.exports = router;

