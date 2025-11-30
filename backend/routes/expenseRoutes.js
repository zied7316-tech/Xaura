const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

const expenseValidation = [
  body('category').isIn(['rent', 'utilities', 'supplies', 'salary', 'marketing', 'maintenance', 'equipment', 'other']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('description').notEmpty().withMessage('Description is required')
];

// Expense routes - require fullFinanceSystem
router.post('/', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), expenseValidation, createExpense);
router.get('/', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), getExpenses);
router.put('/:id', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), updateExpense);
router.delete('/:id', protect, authorize('Owner'), checkSubscriptionFeature('fullFinanceSystem'), deleteExpense);

module.exports = router;

