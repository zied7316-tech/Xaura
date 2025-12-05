const express = require('express');
const router = express.Router();
const {
  getWorkerWallet,
  getUnpaidEarnings,
  getPaidEarnings,
  markEarningAsPaid,
  getPaymentHistory,
  getAllWorkersWallets,
  getWorkerUnpaidEarnings,
  getWorkerPaidEarnings,
  generateInvoice,
  recordEarning,
  getWorkerFinancialSummary,
  getEstimatedEarnings
} = require('../controllers/workerFinanceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Worker routes - require workerPayments
router.get('/wallet', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), getWorkerWallet);
router.get('/paid-earnings', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), getPaidEarnings);
router.get('/unpaid-earnings', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), getUnpaidEarnings);
router.put('/mark-paid/:earningId', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), markEarningAsPaid);
router.get('/estimated-earnings', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), getEstimatedEarnings);
router.get('/payment-history', protect, authorize('Worker'), checkSubscriptionFeature('workerPayments'), getPaymentHistory);

// Owner routes - require fullFinanceSystem
router.get('/all-wallets', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getAllWorkersWallets);
router.get('/unpaid-earnings/:workerId', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getWorkerUnpaidEarnings);
router.get('/paid-earnings/:workerId', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getWorkerPaidEarnings);
router.get('/summary/:workerId', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getWorkerFinancialSummary);
router.post('/generate-invoice', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), generateInvoice);
router.post('/record-earning', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), recordEarning);

module.exports = router;

