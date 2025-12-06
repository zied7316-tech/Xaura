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
    whatsappCredits: {
      balance: {
        type: Number,
        default: TRIAL_CONFIG.freeWhatsAppCredits || TRIAL_CONFIG.freeSmsCredits || 50 // 50 free WhatsApp messages for new salons
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
    },
    smsCredits: {
      balance: {
        type: Number,
        default: TRIAL_CONFIG.freeSmsCredits // 50 free SMS for new salons (deprecated - kept for backward compatibility)
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
  // WhatsApp usage tracking (monthly limits)
  whatsappUsage: {
    currentMonthCount: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    lastMessageDate: {
      type: Date,
      default: null
    }
  },
  // Purchase requests (for cash payments)
  whatsappCreditPurchase: {
    packageType: { type: String, default: null },
    credits: { type: Number, default: null },
    price: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    paymentNote: { type: String, default: null },
    status: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          return v === null || v === undefined || ['pending', 'approved', 'rejected'].includes(v)
        },
        message: 'WhatsApp credit purchase status must be null or one of: pending, approved, rejected'
      }
    },
    requestedAt: { type: Date, default: null }
  },
  smsCreditPurchase: {
    packageType: { type: String, default: null },
    credits: { type: Number, default: null },
    price: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    paymentNote: { type: String, default: null },
    status: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          return v === null || v === undefined || ['pending', 'approved', 'rejected'].includes(v)
        },
        message: 'SMS credit purchase status must be null or one of: pending, approved, rejected'
      }
    },
    requestedAt: { type: Date, default: null }
  },
  pixelTrackingPurchase: {
    price: { type: Number, default: null },
    paymentMethod: { type: String, default: null },
    paymentNote: { type: String, default: null },
    status: {
      type: String,
      default: null,
      validate: {
        validator: function(v) {
          return v === null || v === undefined || ['pending', 'approved', 'rejected'].includes(v)
        },
        message: 'Pixel tracking purchase status must be null or one of: pending, approved, rejected'
      }
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
    },
    maxWhatsAppMessages: {
      type: Number,
      default: 0 // 0 = no limit for basic plan, set by plan features
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

// Method: Use WhatsApp credits
subscriptionSchema.methods.useWhatsAppCredits = async function(amount) {
  if (this.addOns.whatsappCredits.balance < amount) {
    throw new Error('Insufficient WhatsApp credits');
  }
  
  this.addOns.whatsappCredits.balance -= amount;
  this.addOns.whatsappCredits.totalUsed += amount;
  await this.save();
  return this;
};

// Method: Add WhatsApp credits
subscriptionSchema.methods.addWhatsAppCredits = async function(credits, packageType) {
  this.addOns.whatsappCredits.balance += credits;
  this.addOns.whatsappCredits.totalPurchased += credits;
  this.addOns.whatsappCredits.lastRecharge = new Date();
  
  if (packageType) {
    this.addOns.whatsappCredits.autoRechargePackage = packageType;
  }
  
  await this.save();
  return this;
};

// Method: Use SMS credits (deprecated - kept for backward compatibility)
subscriptionSchema.methods.useSmsCredits = async function(amount) {
  if (this.addOns.smsCredits.balance < amount) {
    throw new Error('Insufficient SMS credits');
  }
  
  this.addOns.smsCredits.balance -= amount;
  this.addOns.smsCredits.totalUsed += amount;
  await this.save();
  return this;
};

// Method: Add SMS credits (deprecated - kept for backward compatibility)
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

// Method: Check and reset monthly WhatsApp usage if needed
subscriptionSchema.methods.checkAndResetMonthlyUsage = async function() {
  const now = new Date();
  const lastReset = this.whatsappUsage.lastResetDate || new Date();
  
  // Check if we need to reset (new month started)
  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  if (currentMonth !== lastResetMonth || currentYear !== lastResetYear) {
    // New month - reset counter
    this.whatsappUsage.currentMonthCount = 0;
    this.whatsappUsage.lastResetDate = now;
    await this.save();
    console.log(`[Subscription] Reset monthly WhatsApp usage for subscription ${this._id}`);
  }
  
  return this;
};

// Method: Check if can send WhatsApp message (check limits)
subscriptionSchema.methods.canSendWhatsAppMessage = async function() {
  // Check and reset monthly usage if needed
  await this.checkAndResetMonthlyUsage();
  
  // Get plan details
  const { getPlanDetails } = require('../config/subscriptionPlans');
  const planDetails = getPlanDetails(this.plan);
  
  // Get monthly limit from plan
  const monthlyLimit = planDetails?.features?.maxWhatsAppMessages || 0;
  
  // If monthly limit is 0, check credits instead
  if (monthlyLimit === 0) {
    // Use credit-based system (for Basic plan or credit purchases)
    const creditsAvailable = this.addOns.whatsappCredits?.balance || 0;
    return {
      canSend: creditsAvailable > 0,
      reason: creditsAvailable > 0 ? null : 'Insufficient WhatsApp credits. Please purchase more credits.',
      monthlyLimit: 0,
      currentUsage: this.whatsappUsage.currentMonthCount || 0,
      creditsAvailable
    };
  }
  
  // Check monthly limit
  const currentUsage = this.whatsappUsage.currentMonthCount || 0;
  const canSend = monthlyLimit === -1 || currentUsage < monthlyLimit;
  
  return {
    canSend,
    reason: canSend ? null : `Monthly limit reached (${monthlyLimit} messages/month). Limit resets at start of next month.`,
    monthlyLimit,
    currentUsage,
    remaining: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - currentUsage)
  };
};

// Method: Track WhatsApp message usage (increment counter)
subscriptionSchema.methods.trackWhatsAppMessage = async function() {
  // Check and reset monthly usage if needed
  await this.checkAndResetMonthlyUsage();
  
  // Increment monthly counter
  this.whatsappUsage.currentMonthCount = (this.whatsappUsage.currentMonthCount || 0) + 1;
  this.whatsappUsage.lastMessageDate = new Date();
  
  // If using credit-based system, deduct from credits
  const { getPlanDetails } = require('../config/subscriptionPlans');
  const planDetails = getPlanDetails(this.plan);
  const monthlyLimit = planDetails?.features?.maxWhatsAppMessages || 0;
  
  if (monthlyLimit === 0) {
    // Deduct from credits
    if (this.addOns.whatsappCredits && this.addOns.whatsappCredits.balance > 0) {
      this.addOns.whatsappCredits.balance -= 1;
      this.addOns.whatsappCredits.totalUsed = (this.addOns.whatsappCredits.totalUsed || 0) + 1;
    }
  }
  
  await this.save();
  return this;
};

// Set toJSON to include virtuals
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
