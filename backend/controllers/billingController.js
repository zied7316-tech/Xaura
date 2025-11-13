const BillingHistory = require('../models/BillingHistory');
const PaymentMethod = require('../models/PaymentMethod');
const Subscription = require('../models/Subscription');
const Salon = require('../models/Salon');
const billingService = require('../services/billingService');
const { createActivityLog } = require('../middleware/activityLogger');
const { formatCurrency } = require('../config/subscriptionPlans');

// Stripe is optional
let stripeService = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripeService = require('../services/stripeService');
  }
} catch (error) {
  console.log('Stripe not configured - manual billing only');
}

/**
 * @desc    Get all billing history (Super Admin)
 * @route   GET /api/super-admin/billing
 * @access  Private/SuperAdmin
 */
exports.getAllBillingHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      salon,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (salon) {
      query.salon = salon;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [billing, total] = await Promise.all([
      BillingHistory.find(query)
        .populate('salon', 'name email phone')
        .populate('subscription', 'plan price status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BillingHistory.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: billing,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message,
    });
  }
};

/**
 * @desc    Get revenue statistics
 * @route   GET /api/super-admin/billing/revenue
 * @access  Private/SuperAdmin
 */
exports.getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paidAt = {};
      if (startDate) dateFilter.paidAt.$gte = new Date(startDate);
      if (endDate) dateFilter.paidAt.$lte = new Date(endDate);
    }

    // Total revenue
    const revenueStats = await BillingHistory.aggregate([
      { $match: { status: 'succeeded', ...dateFilter } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' },
        },
      },
    ]);

    // Monthly recurring revenue (MRR)
    const mrr = await Subscription.aggregate([
      { $match: { status: { $in: ['active', 'trial'] } } },
      {
        $group: {
          _id: null,
          totalMRR: { $sum: '$price' },
        },
      },
    ]);

    // Revenue by plan
    const revenueByPlan = await BillingHistory.aggregate([
      { $match: { status: 'succeeded', ...dateFilter } },
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscription',
          foreignField: '_id',
          as: 'subscriptionData',
        },
      },
      { $unwind: '$subscriptionData' },
      {
        $group: {
          _id: '$subscriptionData.plan',
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // Revenue trend (last 12 months)
    const revenueTrend = await BillingHistory.aggregate([
      { $match: { status: 'succeeded', paidAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$paidAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Failed payments
    const failedPayments = await BillingHistory.countDocuments({
      status: 'failed',
      ...dateFilter,
    });

    res.json({
      success: true,
      data: {
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        totalTransactions: revenueStats[0]?.totalTransactions || 0,
        averageTransaction: revenueStats[0]?.averageTransaction || 0,
        mrr: mrr[0]?.totalMRR || 0,
        revenueByPlan,
        revenueTrend,
        failedPayments,
      },
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Manually charge a salon
 * @route   POST /api/super-admin/billing/charge/:subscriptionId
 * @access  Private/SuperAdmin
 */
exports.manualCharge = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId).populate('salon');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    const result = await billingService.chargeSalonSubscription(subscription);

    // Log activity
    await createActivityLog(
      req,
      'subscription_charged',
      'Subscription',
      subscription._id,
      subscription.salon.name,
      { amount: subscription.price, success: result.success }
    );

    res.json({
      success: result.success,
      message: result.success
        ? 'Subscription charged successfully'
        : 'Failed to charge subscription',
      data: result,
    });
  } catch (error) {
    console.error('Error manually charging subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to charge subscription',
      error: error.message,
    });
  }
};

/**
 * @desc    Retry failed payment
 * @route   POST /api/super-admin/billing/retry/:billingId
 * @access  Private/SuperAdmin
 */
exports.retryPayment = async (req, res) => {
  try {
    const result = await billingService.retryFailedPayment(req.params.billingId);

    // Log activity
    await createActivityLog(
      req,
      'subscription_charged',
      'Subscription',
      null,
      'Payment Retry',
      { success: result.success }
    );

    res.json({
      success: result.success,
      message: result.success
        ? 'Payment retried successfully'
        : 'Payment retry failed',
      data: result,
    });
  } catch (error) {
    console.error('Error retrying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry payment',
      error: error.message,
    });
  }
};

/**
 * @desc    Run monthly billing process
 * @route   POST /api/super-admin/billing/process-monthly
 * @access  Private/SuperAdmin
 */
exports.processMonthlyBilling = async (req, res) => {
  try {
    const result = await billingService.processMonthlyBilling();

    // Log activity
    await createActivityLog(
      req,
      'bulk_action',
      'System',
      null,
      'Monthly Billing',
      { 
        description: `Processed monthly billing: ${result.succeeded} succeeded, ${result.failed} failed`,
        ...result 
      }
    );

    res.json({
      success: true,
      message: 'Monthly billing processed',
      data: result,
    });
  } catch (error) {
    console.error('Error processing monthly billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process monthly billing',
      error: error.message,
    });
  }
};

/**
 * @desc    Get salon billing history (Owner)
 * @route   GET /api/billing/history
 * @access  Private/Owner
 */
exports.getSalonBillingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const salon = await Salon.findOne({
      _id: req.user.salonId,
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [billing, total] = await Promise.all([
      BillingHistory.find({ salon: salon._id })
        .populate('subscription', 'plan price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BillingHistory.countDocuments({ salon: salon._id }),
    ]);

    res.json({
      success: true,
      data: billing,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching salon billing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing history',
      error: error.message,
    });
  }
};

/**
 * @desc    Add payment method (Owner)
 * @route   POST /api/billing/payment-method
 * @access  Private/Owner
 */
exports.addPaymentMethod = async (req, res) => {
  try {
    const { stripePaymentMethodId } = req.body;

    const salon = await Salon.findById(req.user.salonId);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check if customer exists, create if not
    let stripeCustomerId = salon.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        salon,
        req.user.email,
        salon.name
      );
      stripeCustomerId = customer.id;
      
      salon.stripeCustomerId = stripeCustomerId;
      await salon.save();
    }

    // Attach payment method to customer
    await stripeService.attachPaymentMethod(stripePaymentMethodId, stripeCustomerId);

    // Get payment method details from Stripe
    const pmDetails = await stripeService.getPaymentMethod(stripePaymentMethodId);

    // Save to database
    const paymentMethod = await PaymentMethod.create({
      salon: salon._id,
      stripeCustomerId,
      stripePaymentMethodId,
      type: pmDetails.type,
      brand: pmDetails.card?.brand,
      last4: pmDetails.card?.last4,
      expiryMonth: pmDetails.card?.exp_month,
      expiryYear: pmDetails.card?.exp_year,
      isDefault: true, // First payment method is default
      billingDetails: pmDetails.billing_details,
    });

    // Set as default in Stripe
    await stripeService.setDefaultPaymentMethod(stripeCustomerId, stripePaymentMethodId);

    res.json({
      success: true,
      message: 'Payment method added successfully',
      data: paymentMethod,
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add payment method',
      error: error.message,
    });
  }
};

/**
 * @desc    Get salon payment methods (Owner)
 * @route   GET /api/billing/payment-methods
 * @access  Private/Owner
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({
      salon: req.user.salonId,
      isActive: true,
    }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete payment method (Owner)
 * @route   DELETE /api/billing/payment-methods/:id
 * @access  Private/Owner
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({
      _id: req.params.id,
      salon: req.user.salonId,
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found',
      });
    }

    // Detach from Stripe (if Stripe is configured)
    if (stripeService && paymentMethod.stripePaymentMethodId) {
      try {
        await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);
      } catch (error) {
        console.log('Could not detach from Stripe:', error.message);
      }
    }

    // Mark as inactive
    paymentMethod.isActive = false;
    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark payment as paid manually (Super Admin - for Tunisia)
 * @route   POST /api/billing/admin/mark-paid/:billingId
 * @access  Private/SuperAdmin
 */
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { transactionId, paymentMethod, notes } = req.body;

    const billing = await BillingHistory.findById(req.params.billingId);

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found',
      });
    }

    // Update billing record
    billing.status = 'succeeded';
    billing.paidAt = new Date();
    billing.transactionId = transactionId || `TXN-${Date.now()}-${billing.salon.toString().slice(-6)}`;
    if (paymentMethod) billing.paymentMethod = paymentMethod;
    if (notes) billing.metadata = { ...billing.metadata, notes };

    await billing.save();

    // Update subscription
    const subscription = await Subscription.findById(billing.subscription);
    if (subscription) {
      subscription.status = 'active';
      subscription.lastPaymentDate = new Date();
      subscription.lastPaymentAmount = billing.amount;
      await subscription.save();
    }

    // Log activity
    await createActivityLog(
      req,
      'subscription_charged',
      'Subscription',
      subscription._id,
      `Manual Payment - ${billing.amount} TND`,
      { paymentMethod, transactionId }
    );

    res.json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: billing,
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as paid',
      error: error.message,
    });
  }
};

