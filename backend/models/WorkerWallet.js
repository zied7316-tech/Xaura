const mongoose = require('mongoose');

const workerWalletSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  // Current unpaid balance
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total earned (all time)
  totalEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  // Total paid out (all time)
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  // Payment schedule preference
  paymentSchedule: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly'
  },
  // Last payout date
  lastPayoutDate: {
    type: Date,
    default: null
  },
  // Next scheduled payout date
  nextPayoutDate: {
    type: Date,
    default: null
  },
  currency: {
    type: String,
    default: 'USD'
  }
}, {
  timestamps: true
});

// Index for faster lookups
workerWalletSchema.index({ workerId: 1, salonId: 1 });

module.exports = mongoose.model('WorkerWallet', workerWalletSchema);

