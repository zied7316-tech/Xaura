const mongoose = require('mongoose');
const { TRIAL_CONFIG } = require('../config/subscriptionPlans');

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
    default: null, // No default - must choose a plan after trial
    validate: {
      validator: function(v) {
        return v === null || v === undefined || ['basic', 'pro', 'enterprise'].includes(v)
      },
      message: 'Plan must be null or one of: basic, pro, enterprise'
    }
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
  // Billing interval
  billingInterval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  // Annual discount applied
  annualDiscount: {
    type: Number,
    default: 0 // 20% discount for annual
  },
  // Status
  status: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled', 'expired'],
    default: 'trial'
  },
  // Trial Management
  trial: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: function() {
        // 45 days initial trial
        return new Date(Date.now() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000);
      }
    },
    confirmationDay: {
      type: Date,
      default: function() {
        // Day 15 for confirmation
        return new Date(Date.now() + TRIAL_CONFIG.confirmationDay * 24 * 60 * 60 * 1000);
      }
    },
    confirmationRequested: {
      type: Boolean,
      default: false
    },
    confirmationResponded: {
      type: Boolean,
      default: false
    },
    confirmationDate: {
      type: Date,
      default: null
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    extended: {
      type: Boolean,
      default: false
    },
    extendedEndDate: {
      type: Date,
      default: null
    },
  },
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: function() {
      const days = this.billingInterval === 'year' ? 365 : 30;
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
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
  // Plan upgrade request (cash payment)
  requestedPlan: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || ['basic', 'pro', 'enterprise'].includes(v)
      },
      message: 'Requested plan must be null or one of: basic, pro, enterprise'
    }
  },
  requestedPlanPrice: {
    type: Number,
    default: null
  },
  paymentMethod: {
    type: String,
    default: null
  },
  paymentNote: {
    type: String,
    default: null
  },
  upgradeStatus: {
    type: String,
    default: null,
    validate: {
      validator: function(v) {
        return v === null || v === undefined || ['pending', 'approved', 'rejected'].includes(v)
      },
      message: 'Upgrade status must be null or one of: pending, approved, rejected'
    }
  },
  upgradeRequestedAt: {
    type: Date,
    default: null
  },
  requestedBillingInterval: {
    type: String,
    enum: ['month', 'year'],
    default: 'month'
  },
  // Add-ons
  addOns: {
    pixelTracking: {
      active: {
        type: Boolean,
        default: false
      },
      startDate: {
        type: Date,
        default: null
      },
      endDate: {
        type: Date,
        default: null
      },
      price: {
        type: Number,
        default: 15 // 15 TND/month
      }
    },
    smsCredits: {
      balance: {
        type: Number,
        default: TRIAL_CONFIG.freeSmsCredits // 50 free SMS for new salons
      },
      totalPurchased: {
        type: Number,
        default: 0
      },
      totalUsed: {
        type: Number,
        default: 0
      },
      lastRecharge: {
        type: Date,
        default: null
      },
      autoRecharge: {
        type: Boolean,
        default: false
      },
      autoRechargeAmount: {
        type: Number,
        default: null
      },
      autoRechargePackage: {
        type: String,
        default: null,
        validate: {
          validator: function(v) {
            return v === null || v === undefined || ['100', '500', '2000'].includes(v)
          },
          message: 'Auto recharge package must be null or one of: 100, 500, 2000'
        }
      }
    }
  },
  // Purchase requests (for cash payments)
  smsCreditPurchase: {
    packageType: { type: String, default: null },
    credits: { type: Number, default: null },
    price: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    paymentNote: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: null
    },
    requestedAt: { type: Date, default: null }
  },
  pixelTrackingPurchase: {
    price: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    paymentNote: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: null
    },
    requestedAt: { type: Date, default: null }
  },
  // Usage Limits (for different plans)
  limits: {
    maxWorkers: {
      type: Number,
      default: 3 // Basic plan default
    },
    maxLocations: {
      type: Number,
      default: 1 // Basic plan default
    },
    maxServices: {
      type: Number,
      default: -1 // Unlimited for all plans
    },
    maxClients: {
      type: Number,
      default: -1 // Unlimited for all plans
    }
  }
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ salonId: 1 });
subscriptionSchema.index({ ownerId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ 'trial.endDate': 1 });
subscriptionSchema.index({ 'trial.confirmationDay': 1 });

// Virtual: Check if trial is active
subscriptionSchema.virtual('isTrialActive').get(function() {
  if (this.status !== 'trial') return false;
  const now = new Date();
  const endDate = this.trial.extended && this.trial.extendedEndDate 
    ? this.trial.extendedEndDate 
    : this.trial.endDate;
  return now < endDate;
});

// Virtual: Check if confirmation is due
subscriptionSchema.virtual('isConfirmationDue').get(function() {
  if (this.status !== 'trial') return false;
  if (this.trial.confirmationResponded) return false;
  const now = new Date();
  return now >= this.trial.confirmationDay && !this.trial.confirmationRequested;
});

// Virtual: Days remaining in trial
subscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (this.status !== 'trial') return 0;
  const now = new Date();
  const endDate = this.trial.extended && this.trial.extendedEndDate 
    ? this.trial.extendedEndDate 
    : this.trial.endDate;
  const diff = endDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Method: Confirm trial continuation
subscriptionSchema.methods.confirmTrial = async function() {
  if (this.status !== 'trial') {
    throw new Error('Subscription is not in trial status');
  }
  
  this.trial.confirmed = true;
  this.trial.confirmationResponded = true;
  this.trial.confirmationDate = new Date();
  
  // Extend trial by additional 30 days
  const currentEndDate = this.trial.extended && this.trial.extendedEndDate 
    ? this.trial.extendedEndDate 
    : this.trial.endDate;
  this.trial.extended = true;
  this.trial.extendedEndDate = new Date(currentEndDate.getTime() + TRIAL_CONFIG.extendedTrialDays * 24 * 60 * 60 * 1000);
  
  await this.save();
  return this;
};

// Method: Request confirmation (at day 15)
subscriptionSchema.methods.requestConfirmation = async function() {
  if (this.status !== 'trial') {
    throw new Error('Subscription is not in trial status');
  }
  
  this.trial.confirmationRequested = true;
  await this.save();
  return this;
};

// Method: Check and update trial status
subscriptionSchema.methods.checkTrialStatus = async function() {
  if (this.status !== 'trial') return this;
  
  const now = new Date();
  const endDate = this.trial.extended && this.trial.extendedEndDate 
    ? this.trial.extendedEndDate 
    : this.trial.endDate;
  
  // If trial expired and no plan selected, mark as expired
  if (now >= endDate && !this.plan) {
    this.status = 'expired';
    await this.save();
  }
  
  return this;
};

// Method: Use SMS credits
subscriptionSchema.methods.useSmsCredits = async function(amount) {
  if (this.addOns.smsCredits.balance < amount) {
    throw new Error('Insufficient SMS credits');
  }
  
  this.addOns.smsCredits.balance -= amount;
  this.addOns.smsCredits.totalUsed += amount;
  await this.save();
  return this;
};

// Method: Add SMS credits
subscriptionSchema.methods.addSmsCredits = async function(credits, packageType) {
  this.addOns.smsCredits.balance += credits;
  this.addOns.smsCredits.totalPurchased += credits;
  this.addOns.smsCredits.lastRecharge = new Date();
  
  if (packageType) {
    this.addOns.smsCredits.autoRechargePackage = packageType;
  }
  
  await this.save();
  return this;
};

// Set toJSON to include virtuals
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
