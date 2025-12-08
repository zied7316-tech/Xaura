const mongoose = require('mongoose');

const dayClosureSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  date: {
    type: Date,
    required: true
  },
  // Financial Summary
  summary: {
    totalRevenue: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 }
  },
  // Appointments Summary
  appointments: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    noShow: { type: Number, default: 0 }
  },
  // Payment Summary
  payments: {
    total: { type: Number, default: 0 },
    cash: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    card: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    bank_transfer: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    online: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    wallet: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    other: {
      count: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    }
  },
  // Cash Verification
  cashVerification: {
    calculatedCash: { type: Number, default: 0 }, // Cash from app calculations
    actualCash: { type: Number, default: null }, // Actual cash count entered by owner
    discrepancy: { type: Number, default: 0 }, // Difference (actual - calculated)
    verified: { type: Boolean, default: false } // Whether cash was verified
  },
  // Worker Performance
  workerPerformance: [{
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    workerName: String,
    appointmentsCompleted: Number,
    revenue: Number,
    commission: Number
  }],
  // Top Services
  topServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: String,
    count: Number,
    revenue: Number
  }],
  // Notes
  notes: {
    type: String,
    default: ''
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  closedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Unique constraint - one closure per salon per day
dayClosureSchema.index({ salonId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DayClosure', dayClosureSchema);

