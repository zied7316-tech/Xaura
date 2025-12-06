const Subscription = require('../models/Subscription');
const Salon = require('../models/Salon');
const User = require('../models/User');
const { getAllPlans, getPlanDetails, getAllAddOns, TRIAL_CONFIG, calculateAnnualPrice } = require('../config/subscriptionPlans');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * Helper function to create trial subscription data
 */
const createTrialSubscription = (salonId, ownerId) => {
  const now = new Date();
  return {
    salonId,
    ownerId,
    plan: null, // No plan during trial
    status: 'trial',
    monthlyFee: 0,
    price: 0,
    trial: {
      startDate: now,
      endDate: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000),
      confirmationDay: new Date(now.getTime() + TRIAL_CONFIG.confirmationDay * 24 * 60 * 60 * 1000)
    },
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000)
  };
};

/**
 * @desc    Get all subscriptions
 * @route   GET /api/super-admin/subscriptions
 * @access  Private (SuperAdmin)
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, plan, search } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (plan && plan !== 'all') {
      query.plan = plan;
    }

    // Build search query for name, phone, or email
    let searchQuery = {};
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      // We'll need to search in populated fields, so we'll filter after population
      searchQuery.searchTerm = search.trim();
    }

    let subscriptions = await Subscription.find(query)
      .populate('salonId', 'name address phone email')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    // Filter by search term if provided (search in salon name, owner name, phone, email)
    if (searchQuery.searchTerm) {
      const searchLower = searchQuery.searchTerm.toLowerCase();
      subscriptions = subscriptions.filter(sub => {
        const salonName = sub.salonId?.name?.toLowerCase() || '';
        const ownerName = sub.ownerId?.name?.toLowerCase() || '';
        const ownerEmail = sub.ownerId?.email?.toLowerCase() || '';
        const ownerPhone = sub.ownerId?.phone?.toLowerCase() || '';
        const salonPhone = sub.salonId?.phone?.toLowerCase() || '';
        const salonEmail = sub.salonId?.email?.toLowerCase() || '';
        
        return salonName.includes(searchLower) ||
               ownerName.includes(searchLower) ||
               ownerEmail.includes(searchLower) ||
               ownerPhone.includes(searchLower) ||
               salonPhone.includes(searchLower) ||
               salonEmail.includes(searchLower);
      });
    }

    // Calculate MRR
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.monthlyFee, 0);

    // Plan distribution
    const planDistribution = subscriptions.reduce((acc, s) => {
      const planKey = s.plan || 'trial';
      acc[planKey] = (acc[planKey] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
      analytics: {
        mrr,
        planDistribution,
        activeCount: subscriptions.filter(s => s.status === 'active').length,
        trialCount: subscriptions.filter(s => s.status === 'trial').length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get subscription details
 * @route   GET /api/super-admin/subscriptions/:id
 * @access  Private (SuperAdmin)
 */
const getSubscriptionDetails = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('salonId')
      .populate('ownerId', 'name email phone');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subscription plan
 * @route   PUT /api/super-admin/subscriptions/:id/plan
 * @access  Private (SuperAdmin)
 */
const updateSubscriptionPlan = async (req, res, next) => {
  try {
    const { plan, monthlyFee } = req.body;
    const { logUserHistory } = require('../utils/userHistoryLogger');

    const subscription = await Subscription.findById(req.params.id)
      .populate('ownerId', 'name role');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const oldPlan = subscription.plan;
    const isUpgrade = !oldPlan || (oldPlan && plan && ['basic', 'pro', 'enterprise'].indexOf(plan) > ['basic', 'pro', 'enterprise'].indexOf(oldPlan));
    
    subscription.plan = plan;
    
    // Get plan details with interval
    const interval = subscription.billingInterval || 'month';
    const planDetails = getPlanDetails(plan, interval);
    const { SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');
    const basePlan = SUBSCRIPTION_PLANS[plan.toLowerCase()];
    
    if (basePlan) {
      subscription.price = basePlan.price[interval] || basePlan.price.month;
      subscription.monthlyFee = interval === 'year' 
        ? subscription.price / 12 
        : subscription.price;
    } else {
      subscription.monthlyFee = monthlyFee || 0;
      subscription.price = monthlyFee || 0;
    }
    
    // If upgrading from trial, activate subscription
    if (subscription.status === 'trial' && plan) {
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date();
      const days = subscription.billingInterval === 'year' ? 365 : 30;
      subscription.currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await subscription.save();

    // Log history for owner
    if (subscription.ownerId) {
      await logUserHistory({
        userId: subscription.ownerId._id,
        userRole: 'Owner',
        action: isUpgrade ? 'plan_upgraded' : 'plan_changed',
        description: `Plan changed from ${oldPlan || 'Trial'} to ${plan}`,
        relatedEntity: {
          type: 'Subscription',
          id: subscription._id,
          name: `${plan} Plan`
        },
        metadata: {
          oldPlan: oldPlan || 'trial',
          newPlan: plan,
          monthlyFee: subscription.monthlyFee,
          interval: interval
        },
        req
      });
    }

    res.json({
      success: true,
      message: `Subscription updated from ${oldPlan} to ${plan}`,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Extend trial period
 * @route   POST /api/super-admin/subscriptions/:id/extend-trial
 * @access  Private (SuperAdmin)
 */
const extendTrial = async (req, res, next) => {
  try {
    const { days } = req.body;

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const currentEndDate = subscription.trial.extended && subscription.trial.extendedEndDate
      ? new Date(subscription.trial.extendedEndDate)
      : new Date(subscription.trial.endDate);
    const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    subscription.trial.extended = true;
    subscription.trial.extendedEndDate = newEndDate;
    await subscription.save();

    res.json({
      success: true,
      message: `Trial extended by ${days} days`,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel subscription
 * @route   PUT /api/super-admin/subscriptions/:id/cancel
 * @access  Private (SuperAdmin)
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reactivate subscription
 * @route   PUT /api/super-admin/subscriptions/:id/reactivate
 * @access  Private (SuperAdmin)
 */
const reactivateSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    subscription.status = 'active';
    subscription.cancelledAt = null;
    subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create subscription for salon (auto-created on salon registration)
 * @route   POST /api/super-admin/subscriptions
 * @access  Private (SuperAdmin)
 */
const createSubscription = async (req, res, next) => {
  try {
    const { salonId, ownerId, plan, monthlyFee } = req.body;

    // Check if subscription already exists
    const existing = await Subscription.findOne({ salonId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Subscription already exists for this salon'
      });
    }

    const subscription = await Subscription.create({
      salonId,
      ownerId,
      plan: plan || null, // No plan during trial
      monthlyFee: monthlyFee || 0,
      status: 'trial'
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get owner's subscription
 * @route   GET /api/owner/subscription
 * @access  Private (Owner)
 */
const getMySubscription = async (req, res, next) => {
  try {
    const ownerSalon = await getOwnerSalon(req.user.id);
    
    if (!ownerSalon || !ownerSalon.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const { salonId } = ownerSalon;

    let subscription = await Subscription.findOne({ salonId })
      .populate('salonId', 'name')
      .populate('ownerId', 'name email');

    // If no subscription exists, create a trial one
    if (!subscription) {
      subscription = await Subscription.create(createTrialSubscription(salonId, req.user.id));
    }

    // Check trial status efficiently (only save if status changed)
    if (subscription.status === 'trial') {
      const now = new Date();
      const endDate = subscription.trial.extended && subscription.trial.extendedEndDate 
        ? new Date(subscription.trial.extendedEndDate) 
        : new Date(subscription.trial.endDate);
      
      // Only update if trial expired
      if (now >= endDate && !subscription.plan) {
        await Subscription.findByIdAndUpdate(subscription._id, { status: 'expired' });
        subscription.status = 'expired';
      }
    }

    // Calculate virtuals manually (faster than using virtuals)
    const needsConfirmation = subscription.status === 'trial' 
      && !subscription.trial.confirmationResponded
      && new Date() >= new Date(subscription.trial.confirmationDay)
      && !subscription.trial.confirmationRequested;

    const trialDaysRemaining = subscription.status === 'trial' ? (() => {
      const now = new Date();
      const endDate = subscription.trial.extended && subscription.trial.extendedEndDate 
        ? new Date(subscription.trial.extendedEndDate) 
        : new Date(subscription.trial.endDate);
      const diff = endDate - now;
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })() : 0;

    const isTrialActive = subscription.status === 'trial' && trialDaysRemaining > 0;

    res.json({
      success: true,
      data: subscription,
      needsConfirmation,
      trialDaysRemaining,
      isTrialActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm trial continuation (at day 15)
 * @route   POST /api/owner/subscription/confirm-trial
 * @access  Private (Owner)
 */
const confirmTrial = async (req, res, next) => {
  try {
    const ownerSalon = await getOwnerSalon(req.user.id);
    
    if (!ownerSalon || !ownerSalon.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const { salonId } = ownerSalon;

    const subscription = await Subscription.findOne({ salonId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'trial') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not in trial status'
      });
    }

    await subscription.confirmTrial();

    res.json({
      success: true,
      message: 'Trial confirmed! You have received an additional 30 days free.',
      data: subscription,
      trialDaysRemaining: subscription.trialDaysRemaining
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request plan upgrade (cash payment)
 * @route   POST /api/owner/subscription/request-upgrade
 * @access  Private (Owner)
 */
const requestPlanUpgrade = async (req, res, next) => {
  try {
    const { plan, billingInterval, paymentMethod, paymentNote } = req.body;
    const ownerSalon = await getOwnerSalon(req.user.id);
    
    if (!ownerSalon || !ownerSalon.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const { salonId } = ownerSalon;

    const interval = billingInterval || 'month';
    const planDetails = getPlanDetails(plan, interval);
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    const subscription = await Subscription.findOne({ salonId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get base plan to access price object
    const { SUBSCRIPTION_PLANS } = require('../config/subscriptionPlans');
    const basePlan = SUBSCRIPTION_PLANS[plan.toLowerCase()];
    const price = interval === 'year' 
      ? basePlan.price.year 
      : basePlan.price.month;

    // Store upgrade request
    subscription.requestedPlan = plan;
    subscription.requestedPlanPrice = price;
    subscription.requestedBillingInterval = interval;
    subscription.paymentMethod = paymentMethod || 'cash';
    subscription.paymentNote = paymentNote;
    subscription.upgradeStatus = 'pending'; // pending, approved, rejected
    subscription.upgradeRequestedAt = new Date();

    await subscription.save();

    res.json({
      success: true,
      message: 'Upgrade request submitted. We will contact you to confirm payment.',
      data: {
        requestedPlan: plan,
        price: price,
        interval: interval,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available plans
 * @route   GET /api/owner/subscription/plans
 * @access  Private (Owner)
 */
const getAvailablePlans = async (req, res, next) => {
  try {
    const plans = getAllPlans();
    const addOns = getAllAddOns();

    res.json({
      success: true,
      data: {
        plans,
        addOns,
        trialConfig: TRIAL_CONFIG
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purchase WhatsApp credits
 * @route   POST /api/owner/subscription/whatsapp-credits/purchase
 * @access  Private (Owner)
 */
const purchaseWhatsAppCredits = async (req, res, next) => {
  try {
    const { packageType, paymentMethod, paymentNote } = req.body;
    const ownerSalon = await getOwnerSalon(req.user.id);
    
    if (!ownerSalon || !ownerSalon.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const { salonId } = ownerSalon;

    const addOns = getAllAddOns();
    const whatsappPackages = addOns.whatsappCredits.packages;
    const selectedPackage = whatsappPackages.find(pkg => 
      pkg.credits.toString() === packageType
    );

    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp package selected'
      });
    }

    const subscription = await Subscription.findOne({ salonId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Store purchase request
    subscription.whatsappCreditPurchase = {
      packageType,
      credits: selectedPackage.credits,
      price: selectedPackage.price,
      paymentMethod: paymentMethod || 'cash',
      paymentNote,
      status: 'pending',
      requestedAt: new Date()
    };

    await subscription.save();

    res.json({
      success: true,
      message: 'WhatsApp credits purchase requested. We will contact you to confirm payment.',
      data: {
        package: selectedPackage,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purchase Pixel Tracking add-on
 * @route   POST /api/owner/subscription/pixel-tracking/purchase
 * @access  Private (Owner)
 */
const purchasePixelTracking = async (req, res, next) => {
  try {
    const { paymentMethod, paymentNote } = req.body;
    const ownerSalon = await getOwnerSalon(req.user.id);
    
    if (!ownerSalon || !ownerSalon.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found. Please create a salon first.'
      });
    }

    const { salonId } = ownerSalon;

    const subscription = await Subscription.findOne({ salonId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if already has pixel tracking (Enterprise includes it)
    if (subscription.plan === 'enterprise') {
      return res.status(400).json({
        success: false,
        message: 'Pixel Tracking is already included in your Enterprise plan'
      });
    }

    // Check if already active
    if (subscription.addOns.pixelTracking.active) {
      return res.status(400).json({
        success: false,
        message: 'Pixel Tracking is already active'
      });
    }

    // Store purchase request
    subscription.pixelTrackingPurchase = {
      price: 15, // 15 TND/month
      paymentMethod: paymentMethod || 'cash',
      paymentNote,
      status: 'pending',
      requestedAt: new Date()
    };

    await subscription.save();

    res.json({
      success: true,
      message: 'Pixel Tracking add-on requested. We will contact you to confirm payment.',
      data: {
        price: 15,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending upgrade requests
 * @route   GET /api/super-admin/subscriptions/pending-upgrades
 * @access  Private (SuperAdmin)
 */
const getPendingUpgrades = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      upgradeStatus: 'pending'
    })
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ upgradeRequestedAt: -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve upgrade request
 * @route   POST /api/super-admin/subscriptions/:id/approve-upgrade
 * @access  Private (SuperAdmin)
 */
const approveUpgrade = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.upgradeStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Upgrade request is not pending'
      });
    }

    // Activate subscription with requested plan
    subscription.plan = subscription.requestedPlan;
    subscription.price = subscription.requestedPlanPrice;
    subscription.monthlyFee = subscription.requestedBillingInterval === 'year' 
      ? subscription.requestedPlanPrice / 12 
      : subscription.requestedPlanPrice;
    subscription.billingInterval = subscription.requestedBillingInterval || 'month';
    subscription.status = 'active';
    subscription.upgradeStatus = 'approved';
    subscription.currentPeriodStart = new Date();
    
    // Set period end based on interval
    const days = subscription.billingInterval === 'year' ? 365 : 30;
    subscription.currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    // Apply annual discount if applicable
    if (subscription.billingInterval === 'year') {
      subscription.annualDiscount = 20; // 20% discount
    }

    await subscription.save();

    res.json({
      success: true,
      message: 'Upgrade approved and subscription activated',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending WhatsApp credit purchases
 * @route   GET /api/super-admin/subscriptions/pending-whatsapp
 * @access  Private (SuperAdmin)
 */
const getPendingWhatsAppPurchases = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      'whatsappCreditPurchase.status': 'pending',
      'whatsappCreditPurchase.credits': { $exists: true, $ne: null, $gt: 0 },
      'whatsappCreditPurchase.price': { $exists: true, $ne: null, $gt: 0 },
      'whatsappCreditPurchase.requestedAt': { $exists: true, $ne: null }
    })
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ 'whatsappCreditPurchase.requestedAt': -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve WhatsApp credits purchase
 * @route   POST /api/super-admin/subscriptions/:id/approve-whatsapp
 * @access  Private (SuperAdmin)
 */
const approveWhatsAppPurchase = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (!subscription.whatsappCreditPurchase || subscription.whatsappCreditPurchase.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp purchase request is not pending'
      });
    }

    // Add credits
    await subscription.addWhatsAppCredits(
      subscription.whatsappCreditPurchase.credits,
      subscription.whatsappCreditPurchase.packageType
    );

    // Mark as approved
    subscription.whatsappCreditPurchase.status = 'approved';

    await subscription.save();

    res.json({
      success: true,
      message: 'WhatsApp credits approved and added',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending Pixel Tracking purchases
 * @route   GET /api/super-admin/subscriptions/pending-pixel
 * @access  Private (SuperAdmin)
 */
const getPendingPixelPurchases = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({
      'pixelTrackingPurchase.status': 'pending',
      'pixelTrackingPurchase.price': { $exists: true, $ne: null, $gt: 0 },
      'pixelTrackingPurchase.requestedAt': { $exists: true, $ne: null }
    })
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ 'pixelTrackingPurchase.requestedAt': -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve Pixel Tracking purchase
 * @route   POST /api/super-admin/subscriptions/:id/approve-pixel
 * @access  Private (SuperAdmin)
 */
const approvePixelPurchase = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (!subscription.pixelTrackingPurchase || subscription.pixelTrackingPurchase.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Pixel Tracking purchase request is not pending'
      });
    }

    // Activate Pixel Tracking
    subscription.addOns.pixelTracking.active = true;
    subscription.addOns.pixelTracking.startDate = new Date();
    subscription.addOns.pixelTracking.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Mark as approved
    subscription.pixelTrackingPurchase.status = 'approved';

    await subscription.save();

    res.json({
      success: true,
      message: 'Pixel Tracking approved and activated',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fix missing subscriptions for all salons (Migration helper)
 * @route   POST /api/super-admin/subscriptions/fix-missing
 * @access  Private (SuperAdmin)
 */
const fixMissingSubscriptions = async (req, res, next) => {
  try {
    const Salon = require('../models/Salon');
    const salons = await Salon.find({}).populate('ownerId', '_id');
    
    let created = 0;
    let skipped = 0;
    let errors = [];

    for (const salon of salons) {
      try {
        // Check if subscription exists
        const existing = await Subscription.findOne({ salonId: salon._id });
        if (existing) {
          skipped++;
          continue;
        }

        // Get owner ID
        const ownerId = salon.ownerId?._id || salon.ownerId;
        if (!ownerId) {
          errors.push(`Salon ${salon.name} (${salon._id}) has no owner`);
          continue;
        }

        // Create trial subscription
        await Subscription.create(createTrialSubscription(salon._id, ownerId));
        created++;
      } catch (error) {
        errors.push(`Error creating subscription for salon ${salon.name}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Fixed missing subscriptions: ${created} created, ${skipped} already exist`,
      data: {
        created,
        skipped,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Super Admin exports
  getAllSubscriptions,
  getSubscriptionDetails,
  updateSubscriptionPlan,
  extendTrial,
  cancelSubscription,
  reactivateSubscription,
  createSubscription,
  fixMissingSubscriptions,
  getPendingUpgrades,
  approveUpgrade,
  getPendingWhatsAppPurchases,
  approveWhatsAppPurchase,
  getPendingPixelPurchases,
  approvePixelPurchase,
  // Owner exports
  getMySubscription,
  confirmTrial,
  requestPlanUpgrade,
  getAvailablePlans,
  purchaseWhatsAppCredits,
  purchasePixelTracking
};



