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

const expenseValidation = [
  body('category').isIn(['rent', 'utilities', 'supplies', 'salary', 'marketing', 'maintenance', 'equipment', 'other']).withMessage('Invalid category'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('description').notEmpty().withMessage('Description is required')
];

router.post('/', protect, authorize('Owner'), expenseValidation, createExpense);
router.get('/', protect, authorize('Owner'), getExpenses);
router.put('/:id', protect, authorize('Owner'), updateExpense);
router.delete('/:id', protect, authorize('Owner'), deleteExpense);

module.exports = router;

