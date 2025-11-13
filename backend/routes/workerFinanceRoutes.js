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
  generateInvoice,
  recordEarning,
  getWorkerFinancialSummary,
  getEstimatedEarnings
} = require('../controllers/workerFinanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Worker routes
router.get('/wallet', protect, authorize('Worker'), getWorkerWallet);
router.get('/paid-earnings', protect, authorize('Worker'), getPaidEarnings);
router.get('/unpaid-earnings', protect, authorize('Worker'), getUnpaidEarnings);
router.put('/mark-paid/:earningId', protect, authorize('Worker'), markEarningAsPaid);
router.get('/estimated-earnings', protect, authorize('Worker'), getEstimatedEarnings);
router.get('/payment-history', protect, authorize('Worker'), getPaymentHistory);

// Owner routes
router.get('/all-wallets', protect, authorize('Owner'), getAllWorkersWallets);
router.get('/unpaid-earnings/:workerId', protect, authorize('Owner'), getWorkerUnpaidEarnings);
router.get('/summary/:workerId', protect, authorize('Owner'), getWorkerFinancialSummary);
router.post('/generate-invoice', protect, authorize('Owner'), generateInvoice);
router.post('/record-earning', protect, authorize('Owner'), recordEarning);

module.exports = router;

