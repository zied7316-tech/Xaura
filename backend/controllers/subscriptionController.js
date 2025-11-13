const Subscription = require('../models/Subscription');
const Salon = require('../models/Salon');
const User = require('../models/User');
const { getAllPlans, getPlanDetails } = require('../config/subscriptionPlans');

/**
 * @desc    Get all subscriptions
 * @route   GET /api/super-admin/subscriptions
 * @access  Private (SuperAdmin)
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, plan } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (plan && plan !== 'all') {
      query.plan = plan;
    }

    const subscriptions = await Subscription.find(query)
      .populate('salonId', 'name address')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    // Calculate MRR
    const mrr = subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.monthlyFee, 0);

    // Plan distribution
    const planDistribution = subscriptions.reduce((acc, s) => {
      acc[s.plan] = (acc[s.plan] || 0) + 1;
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

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const oldPlan = subscription.plan;
    subscription.plan = plan;
    subscription.monthlyFee = monthlyFee;
    
    // If upgrading from trial, activate subscription
    if (subscription.status === 'trial' && plan !== 'free') {
      subscription.status = 'active';
    }

    await subscription.save();

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

    const currentEndDate = new Date(subscription.trialEndDate);
    const newEndDate = new Date(currentEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    subscription.trialEndDate = newEndDate;
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
      plan: plan || 'free',
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

module.exports = {
  getAllSubscriptions,
  getSubscriptionDetails,
  updateSubscriptionPlan,
  extendTrial,
  cancelSubscription,
  reactivateSubscription,
  createSubscription
};



