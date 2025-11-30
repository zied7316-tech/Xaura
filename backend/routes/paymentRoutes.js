const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createPayment,
  getPayments,
  getRevenueSummary
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

const paymentValidation = [
  body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
  body('paymentMethod').isIn(['cash', 'card', 'online', 'wallet']).withMessage('Invalid payment method')
];

// Payment routes - require fullFinanceSystem
router.post('/', protect, authorize('Owner', 'Worker'), checkSubscriptionFeature('fullFinanceSystem'), paymentValidation, createPayment);
router.get('/', protect, authorize('Owner', 'Worker'), checkSubscriptionFeature('fullFinanceSystem'), getPayments);
router.get('/revenue', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getRevenueSummary);

module.exports = router;

