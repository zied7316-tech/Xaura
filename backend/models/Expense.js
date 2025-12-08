const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  category: {
    type: String,
    enum: ['rent', 'utilities', 'internet', 'supplies', 'salary', 'marketing', 'maintenance', 'equipment', 'insurance', 'taxes', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  vendor: {
    type: String,
    default: '',
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'other'],
    default: 'cash'
  },
  receiptNumber: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  isPaid: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: ''
  },
  // For tracking recurring expenses
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'none'],
    default: 'none'
  }
}, {
  timestamps: true
});

// Indexes for expense reports
expenseSchema.index({ salonId: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);

