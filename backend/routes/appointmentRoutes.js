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

// Validation rules
const createAppointmentValidation = [
  body('workerId').notEmpty().withMessage('Worker ID is required'),
  body('dateTime').isISO8601().withMessage('Valid date and time is required'),
  // Either serviceId OR services array is required
  body('serviceId').optional().notEmpty().withMessage('Service ID cannot be empty if provided'),
  body('services').optional().isArray({ min: 1 }).withMessage('Services must be a non-empty array if provided'),
  body('services.*.serviceId').optional().notEmpty().withMessage('Each service must have a serviceId'),
  body('services.*.name').optional().isString().withMessage('Each service must have a name'),
  body('services.*.price').optional().isNumeric().withMessage('Each service must have a numeric price'),
  body('services.*.duration').optional().isNumeric().withMessage('Each service must have a numeric duration')
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

