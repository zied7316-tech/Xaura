const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  getRevenueSummary
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const paymentValidation = [
  body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
  body('paymentMethod').isIn(['cash', 'card', 'online', 'wallet']).withMessage('Invalid payment method')
];

router.post('/', protect, authorize('Owner', 'Worker'), paymentValidation, createPayment);
router.get('/', protect, authorize('Owner', 'Worker'), getPayments);
router.get('/revenue', protect, authorize('Owner'), getRevenueSummary);

module.exports = router;

