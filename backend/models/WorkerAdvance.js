const mongoose = require('mongoose');

const workerAdvanceSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Worker is required']
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  reason: {
    type: String,
    default: '',
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'deducted'],
    default: 'approved'
  },
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner who gave the advance is required']
  },
  givenAt: {
    type: Date,
    default: Date.now
  },
  deductedAt: {
    type: Date,
    default: null
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerInvoice',
    default: null
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
workerAdvanceSchema.index({ workerId: 1, status: 1 });
workerAdvanceSchema.index({ salonId: 1, createdAt: -1 });
workerAdvanceSchema.index({ invoiceId: 1 });

module.exports = mongoose.model('WorkerAdvance', workerAdvanceSchema);

