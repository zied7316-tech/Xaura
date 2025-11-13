const express = require('express');
const router = express.Router();
const {
  getAllBillingHistory,
  getRevenueStats,
  manualCharge,
  retryPayment,
  processMonthlyBilling,
  markPaymentAsPaid,
  getSalonBillingHistory,
  addPaymentMethod,
  getPaymentMethods,
  deletePaymentMethod,
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Super Admin routes
router.get('/admin/all', protect, authorize('SuperAdmin'), getAllBillingHistory);
router.get('/admin/revenue', protect, authorize('SuperAdmin'), getRevenueStats);
router.post('/admin/charge/:subscriptionId', protect, authorize('SuperAdmin'), manualCharge);
router.post('/admin/retry/:billingId', protect, authorize('SuperAdmin'), retryPayment);
router.post('/admin/process-monthly', protect, authorize('SuperAdmin'), processMonthlyBilling);
router.post('/admin/mark-paid/:billingId', protect, authorize('SuperAdmin'), markPaymentAsPaid);

// Owner routes
router.get('/history', protect, authorize('Owner'), getSalonBillingHistory);
router.post('/payment-method', protect, authorize('Owner'), addPaymentMethod);
router.get('/payment-methods', protect, authorize('Owner'), getPaymentMethods);
router.delete('/payment-methods/:id', protect, authorize('Owner'), deletePaymentMethod);

module.exports = router;

