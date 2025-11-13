const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getWorkers,
  getWorkerDetails,
  updateWorker,
  removeWorker,
  getWorkerPerformance,
  compareWorkerPerformance
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Validation for worker update
const updateWorkerValidation = [
  body('paymentModel.type').optional().isIn(['fixed_salary', 'percentage_commission', 'hybrid']),
  body('paymentModel.fixedSalary').optional().isFloat({ min: 0 }),
  body('paymentModel.commissionPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('paymentModel.baseSalary').optional().isFloat({ min: 0 })
];

// All routes require Owner authentication
router.get('/', protect, authorize('Owner'), getWorkers);
router.get('/performance/compare', protect, authorize('Owner'), compareWorkerPerformance);
router.get('/:id', protect, authorize('Owner'), getWorkerDetails);
router.get('/:id/performance', protect, authorize('Owner'), getWorkerPerformance);
router.put('/:id', protect, authorize('Owner'), updateWorkerValidation, updateWorker);
router.delete('/:id', protect, authorize('Owner'), removeWorker);

module.exports = router;

