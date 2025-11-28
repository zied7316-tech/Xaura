const Subscription = require('../models/Subscription');
const { getPlanDetails } = require('../config/subscriptionPlans');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * Check if subscription has a specific feature
 * @param {string} featureName - Feature to check
 * @returns {Function} Express middleware
 */
const checkSubscriptionFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      // Skip check for SuperAdmin
      if (req.user && req.user.role === 'SuperAdmin') {
        return next();
      }

      // Get owner's salon
      const { salonId } = await getOwnerSalon(req.user.id);
      
      if (!salonId) {
        return res.status(404).json({
          success: false,
          message: 'Salon not found'
        });
      }

      // Get subscription
      const subscription = await Subscription.findOne({ salonId });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No subscription found. Please subscribe to a plan.',
          requiresPlan: true
        });
      }

      // Check if trial is still active
      if (subscription.status === 'trial') {
        await subscription.checkTrialStatus();
        
        // Allow access during trial (all features available)
        if (subscription.isTrialActive) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Trial period has expired. Please choose a subscription plan.',
            trialExpired: true,
            requiresPlan: true
          });
        }
      }

      // Check if subscription is active
      if (subscription.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Subscription is not active. Please renew your subscription.',
          requiresPlan: true
        });
      }

      // Get plan details
      const planDetails = getPlanDetails(subscription.plan);

      if (!planDetails) {
        return res.status(403).json({
          success: false,
          message: 'Invalid subscription plan'
        });
      }

      // Check feature
      const hasFeature = planDetails.features[featureName];

      if (!hasFeature) {
        // Check if feature is available as add-on
        let addOnMessage = '';
        
        if (featureName === 'pixelTracking' && subscription.addOns.pixelTracking.active) {
          return next(); // Has add-on
        }

        return res.status(403).json({
          success: false,
          message: `This feature requires a higher plan or add-on.`,
          feature: featureName,
          currentPlan: subscription.plan,
          requiresUpgrade: true,
          addOnMessage
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check subscription limits (workers, locations, etc.)
 * @param {string} limitType - Type of limit to check (maxWorkers, maxLocations, etc.)
 * @returns {Function} Express middleware
 */
const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      // Skip check for SuperAdmin
      if (req.user && req.user.role === 'SuperAdmin') {
        return next();
      }

      // Get owner's salon
      const { salonId } = await getOwnerSalon(req.user.id);
      
      if (!salonId) {
        return res.status(404).json({
          success: false,
          message: 'Salon not found'
        });
      }

      // Get subscription
      const subscription = await Subscription.findOne({ salonId });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message: 'No subscription found'
        });
      }

      // During trial, allow unlimited
      if (subscription.status === 'trial' && subscription.isTrialActive) {
        return next();
      }

      // Get plan details
      const planDetails = getPlanDetails(subscription.plan);

      if (!planDetails) {
        return res.status(403).json({
          success: false,
          message: 'Invalid subscription plan'
        });
      }

      // Get limit from plan features
      const limit = planDetails.features[limitType];

      // -1 means unlimited
      if (limit === -1) {
        return next();
      }

      // Check current usage
      const User = require('../models/User');
      const SalonOwnership = require('../models/SalonOwnership');

      let currentCount = 0;

      if (limitType === 'maxWorkers') {
        currentCount = await User.countDocuments({ 
          salonId, 
          role: 'Worker',
          isActive: true 
        });
      } else if (limitType === 'maxLocations') {
        currentCount = await SalonOwnership.countDocuments({ 
          user: req.user.id,
          isActive: true 
        });
      }

      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          message: `You have reached the limit of ${limit} ${limitType.replace('max', '').toLowerCase()} for your plan. Please upgrade to add more.`,
          limit,
          currentCount,
          requiresUpgrade: true
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if subscription is active or in trial
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    // Skip check for SuperAdmin
    if (req.user && req.user.role === 'SuperAdmin') {
      return next();
    }

    // Get owner's salon
    const { salonId } = await getOwnerSalon(req.user.id);
    
    if (!salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get subscription
    const subscription = await Subscription.findOne({ salonId });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No subscription found. Please subscribe to a plan.',
        requiresPlan: true
      });
    }

    // Check trial status
    if (subscription.status === 'trial') {
      await subscription.checkTrialStatus();
      
      if (subscription.isTrialActive) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Trial period has expired. Please choose a subscription plan.',
          trialExpired: true,
          requiresPlan: true
        });
      }
    }

    // Check if active
    if (subscription.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Subscription is not active. Please renew your subscription.',
        requiresPlan: true
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkSubscriptionFeature,
  checkSubscriptionLimit,
  requireActiveSubscription
};

