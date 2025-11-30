const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getWorkers,
  getWorkerDetails,
  updateWorker,
  removeWorker,
  getWorkerPerformance,
  compareWorkerPerformance,
  checkWorkerAvailability
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Validation for worker update
const updateWorkerValidation = [
  body('paymentModel.type').optional().isIn(['fixed_salary', 'percentage_commission', 'hybrid']),
  body('paymentModel.fixedSalary').optional().isFloat({ min: 0 }),
  body('paymentModel.commissionPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('paymentModel.baseSalary').optional().isFloat({ min: 0 })
];

// All routes require Owner authentication
// Basic worker management - available in all plans
router.get('/', protect, authorize('Owner'), getWorkers);
router.get('/:id', protect, authorize('Owner'), getWorkerDetails);
router.get('/:id/check-availability', protect, authorize('Owner'), checkWorkerAvailability);
router.put('/:id', protect, authorize('Owner'), updateWorkerValidation, updateWorker);
router.delete('/:id', protect, authorize('Owner'), removeWorker);

// Advanced worker analytics - Pro and Enterprise only
router.get('/performance/compare', protect, authorize('Owner'), checkSubscriptionFeature('workerPerformanceDashboard'), compareWorkerPerformance);
router.get('/:id/performance', protect, authorize('Owner'), checkSubscriptionFeature('workerPerformanceDashboard'), getWorkerPerformance);

module.exports = router;

