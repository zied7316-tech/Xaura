const Expense = require('../models/Expense');
const Salon = require('../models/Salon');
const { validationResult } = require('express-validator');

/**
 * @desc    Create expense
 * @route   POST /api/expenses
 * @access  Private (Owner)
 */
const createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const expense = await Expense.create({
      ...req.body,
      salonId: salon._id
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get expenses
 * @route   GET /api/expenses
 * @access  Private (Owner)
 */
const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, isPaid } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        count: 0,
        data: { expenses: [] }
      });
    }

    const filter = { salonId: salon._id };
    
    if (category) filter.category = category;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      data: { expenses }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private (Owner)
 */
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Verify ownership
    const salon = await Salon.findOne({ _id: expense.salonId, ownerId: req.user.id });
    if (!salon) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: updatedExpense }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private (Owner)
 */
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Verify ownership
    const salon = await Salon.findOne({ _id: expense.salonId, ownerId: req.user.id });
    if (!salon) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense
};

