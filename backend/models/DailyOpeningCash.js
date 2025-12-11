const mongoose = require('mongoose');

const dailyOpeningCashSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  date: {
    type: Date,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure one record per salon per day
dailyOpeningCashSchema.index({ salonId: 1, date: 1 }, { unique: true });

// Index for faster lookups
dailyOpeningCashSchema.index({ salonId: 1, date: -1 });

module.exports = mongoose.model('DailyOpeningCash', dailyOpeningCashSchema);

