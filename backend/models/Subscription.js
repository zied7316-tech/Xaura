const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Subscription Plan
  plan: {
    type: String,
    enum: ['free', 'basic', 'professional', 'enterprise'],
    default: 'free'
  },
  // Pricing (in Tunisian Dinar - TND)
  monthlyFee: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'TND' // Tunisian Dinar
  },
  // Status
  status: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled'],
    default: 'trial'
  },
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  trialEndDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days trial
    }
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  // Payments
  totalRevenue: {
    type: Number,
    default: 0
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  // Usage Limits (for different plans)
  limits: {
    maxWorkers: {
      type: Number,
      default: 10
    },
    maxServices: {
      type: Number,
      default: 50
    },
    maxClients: {
      type: Number,
      default: 1000
    }
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ salonId: 1 });
subscriptionSchema.index({ ownerId: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);



