const Subscription = require('../models/Subscription');
const Salon = require('../models/Salon');
const BillingHistory = require('../models/BillingHistory');
const { createActivityLog } = require('../middleware/activityLogger');

/**
 * @desc    Get financial overview and analytics
 * @route   GET /api/super-admin/finance/overview
 * @access  Private (SuperAdmin)
 */
const getFinancialOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter for upgrade payments
    const upgradeDateFilter = { upgradePaymentReceived: true };
    if (startDate || endDate) {
      upgradeDateFilter.upgradePaymentReceivedAt = {};
      if (startDate) upgradeDateFilter.upgradePaymentReceivedAt.$gte = new Date(startDate);
      if (endDate) upgradeDateFilter.upgradePaymentReceivedAt.$lte = new Date(endDate);
    }

    // Total revenue from subscriptions (paid upgrades)
    const subscriptionRevenue = await Subscription.aggregate([
      {
        $match: upgradeDateFilter
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$requestedPlanPrice', '$price', 0] } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Build date filter for WhatsApp payments
    const whatsappDateFilter = {
      'whatsappCreditPurchase.status': 'approved',
      'whatsappCreditPurchase.paymentReceived': true
    };
    if (startDate || endDate) {
      whatsappDateFilter['whatsappCreditPurchase.paymentReceivedAt'] = {};
      if (startDate) whatsappDateFilter['whatsappCreditPurchase.paymentReceivedAt'].$gte = new Date(startDate);
      if (endDate) whatsappDateFilter['whatsappCreditPurchase.paymentReceivedAt'].$lte = new Date(endDate);
    }

    // Revenue from WhatsApp credits
    const whatsappRevenue = await Subscription.aggregate([
      {
        $match: whatsappDateFilter
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$whatsappCreditPurchase.price', 0] } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Build date filter for Pixel payments
    const pixelDateFilter = {
      'pixelTrackingPurchase.status': 'approved',
      'pixelTrackingPurchase.paymentReceived': true
    };
    if (startDate || endDate) {
      pixelDateFilter['pixelTrackingPurchase.paymentReceivedAt'] = {};
      if (startDate) pixelDateFilter['pixelTrackingPurchase.paymentReceivedAt'].$gte = new Date(startDate);
      if (endDate) pixelDateFilter['pixelTrackingPurchase.paymentReceivedAt'].$lte = new Date(endDate);
    }

    // Revenue from Pixel Tracking
    const pixelRevenue = await Subscription.aggregate([
      {
        $match: pixelDateFilter
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$pixelTrackingPurchase.price', 15] } },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    // Revenue from BillingHistory (recurring payments)
    const billingRevenue = await BillingHistory.aggregate([
      {
        $match: {
          status: 'succeeded',
          ...(startDate || endDate ? {
            paidAt: {
              ...(startDate ? { $gte: new Date(startDate) } : {}),
              ...(endDate ? { $lte: new Date(endDate) } : {})
            }
          } : {})
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    const subRev = subscriptionRevenue[0] || { totalRevenue: 0, transactionCount: 0 };
    const whatsappRev = whatsappRevenue[0] || { totalRevenue: 0, transactionCount: 0 };
    const pixelRev = pixelRevenue[0] || { totalRevenue: 0, transactionCount: 0 };
    const billingRev = billingRevenue[0] || { totalRevenue: 0, transactionCount: 0 };

    const totalRevenue = subRev.totalRevenue + whatsappRev.totalRevenue + pixelRev.totalRevenue + billingRev.totalRevenue;
    const totalTransactions = subRev.transactionCount + whatsappRev.transactionCount + pixelRev.transactionCount + billingRev.transactionCount;

    // Outstanding payments (approved but unpaid)
    const outstandingUpgrades = await Subscription.countDocuments({
      upgradeStatus: 'approved',
      upgradePaymentReceived: false
    });

    const outstandingWhatsApp = await Subscription.countDocuments({
      'whatsappCreditPurchase.status': 'approved',
      'whatsappCreditPurchase.paymentReceived': false
    });

    const outstandingPixel = await Subscription.countDocuments({
      'pixelTrackingPurchase.status': 'approved',
      'pixelTrackingPurchase.paymentReceived': false
    });

    const outstandingCount = outstandingUpgrades + outstandingWhatsApp + outstandingPixel;

    // Calculate outstanding amounts
    const outstandingAmounts = await Subscription.aggregate([
      {
        $match: {
          $or: [
            { upgradeStatus: 'approved', upgradePaymentReceived: false },
            { 'whatsappCreditPurchase.status': 'approved', 'whatsappCreditPurchase.paymentReceived': false },
            { 'pixelTrackingPurchase.status': 'approved', 'pixelTrackingPurchase.paymentReceived': false }
          ]
        }
      },
      {
        $group: {
          _id: null,
          upgradeAmount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$upgradeStatus', 'approved'] }, { $eq: ['$upgradePaymentReceived', false] }] },
                { $ifNull: ['$requestedPlanPrice', '$price', 0] },
                0
              ]
            }
          },
          whatsappAmount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$whatsappCreditPurchase.status', 'approved'] }, { $eq: ['$whatsappCreditPurchase.paymentReceived', false] }] },
                { $ifNull: ['$whatsappCreditPurchase.price', 0] },
                0
              ]
            }
          },
          pixelAmount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$pixelTrackingPurchase.status', 'approved'] }, { $eq: ['$pixelTrackingPurchase.paymentReceived', false] }] },
                { $ifNull: ['$pixelTrackingPurchase.price', 15] },
                0
              ]
            }
          }
        }
      }
    ]);

    const outstanding = outstandingAmounts[0] || { upgradeAmount: 0, whatsappAmount: 0, pixelAmount: 0 };
    const totalOutstanding = outstanding.upgradeAmount + outstanding.whatsappAmount + outstanding.pixelAmount;

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions,
        revenueByCategory: {
          subscriptions: subRev.totalRevenue,
          whatsappCredits: whatsappRev.totalRevenue,
          pixelTracking: pixelRev.totalRevenue,
          recurringBilling: billingRev.totalRevenue
        },
        transactionsByCategory: {
          subscriptions: subRev.transactionCount,
          whatsappCredits: whatsappRev.transactionCount,
          pixelTracking: pixelRev.transactionCount,
          recurringBilling: billingRev.transactionCount
        },
        outstanding: {
          count: outstandingCount,
          amount: totalOutstanding,
          breakdown: {
            upgrades: outstandingUpgrades,
            whatsapp: outstandingWhatsApp,
            pixel: outstandingPixel,
            upgradeAmount: outstanding.upgradeAmount,
            whatsappAmount: outstanding.whatsappAmount,
            pixelAmount: outstanding.pixelAmount
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all financial transactions
 * @route   GET /api/super-admin/finance/transactions
 * @access  Private (SuperAdmin)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const { 
      salonId, 
      type, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transactions = [];

    // Get subscription upgrade payments
    const upgradeFilter = {};
    if (salonId) upgradeFilter.salonId = salonId;
    if (startDate || endDate) {
      upgradeFilter.upgradePaymentReceivedAt = {};
      if (startDate) upgradeFilter.upgradePaymentReceivedAt.$gte = new Date(startDate);
      if (endDate) upgradeFilter.upgradePaymentReceivedAt.$lte = new Date(endDate);
    }
    
    if (status === 'paid') {
      upgradeFilter.upgradePaymentReceived = true;
      upgradeFilter.upgradeStatus = 'approved';
    } else if (status === 'unpaid') {
      upgradeFilter.upgradePaymentReceived = false;
      upgradeFilter.upgradeStatus = 'approved';
    } else if (status === 'pending') {
      upgradeFilter.upgradeStatus = 'pending';
    }

    const upgrades = await Subscription.find(upgradeFilter)
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ upgradePaymentReceivedAt: -1, upgradeRequestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit) / 3) // Distribute limit across types
      .lean();

    upgrades.forEach(sub => {
      if (sub.upgradeStatus === 'approved' && (sub.upgradePaymentReceived || status === 'unpaid' || !status)) {
        transactions.push({
          _id: sub._id,
          transactionId: `UPG-${sub._id}`,
          date: sub.upgradePaymentReceivedAt || sub.upgradeRequestedAt,
          salonId: sub.salonId?._id,
          salonName: sub.salonId?.name,
          ownerName: sub.salonId ? sub.ownerId?.name : null,
          type: 'plan_upgrade',
          category: 'Subscription Plan',
          plan: sub.plan || sub.requestedPlan,
          amount: sub.requestedPlanPrice || sub.price || 0,
          paymentMethod: sub.paymentMethod || 'cash',
          status: sub.upgradePaymentReceived ? 'paid' : (sub.upgradeStatus === 'approved' ? 'unpaid' : 'pending'),
          approvedAt: sub.upgradeRequestedAt,
          paidAt: sub.upgradePaymentReceivedAt,
          billingInterval: sub.requestedBillingInterval || sub.billingInterval
        });
      }
    });

    // Get WhatsApp credits purchases
    const whatsappFilter = {};
    if (salonId) whatsappFilter.salonId = salonId;
    if (startDate || endDate) {
      whatsappFilter['whatsappCreditPurchase.paymentReceivedAt'] = {};
      if (startDate) whatsappFilter['whatsappCreditPurchase.paymentReceivedAt'].$gte = new Date(startDate);
      if (endDate) whatsappFilter['whatsappCreditPurchase.paymentReceivedAt'].$lte = new Date(endDate);
    }

    if (status === 'paid') {
      whatsappFilter['whatsappCreditPurchase.paymentReceived'] = true;
      whatsappFilter['whatsappCreditPurchase.status'] = 'approved';
    } else if (status === 'unpaid') {
      whatsappFilter['whatsappCreditPurchase.paymentReceived'] = false;
      whatsappFilter['whatsappCreditPurchase.status'] = 'approved';
    } else if (status === 'pending') {
      whatsappFilter['whatsappCreditPurchase.status'] = 'pending';
    }

    const whatsappPurchases = await Subscription.find(whatsappFilter)
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ 'whatsappCreditPurchase.paymentReceivedAt': -1, 'whatsappCreditPurchase.requestedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit) / 3)
      .lean();

    whatsappPurchases.forEach(sub => {
      const purchase = sub.whatsappCreditPurchase;
      if (purchase && purchase.status === 'approved' && (purchase.paymentReceived || status === 'unpaid' || !status)) {
        transactions.push({
          _id: sub._id,
          transactionId: `WA-${sub._id}`,
          date: purchase.paymentReceivedAt || purchase.requestedAt,
          salonId: sub.salonId?._id,
          salonName: sub.salonId?.name,
          ownerName: sub.salonId ? sub.ownerId?.name : null,
          type: 'whatsapp_credits',
          category: 'WhatsApp Credits',
          credits: purchase.credits,
          packageType: purchase.packageType,
          amount: purchase.price || 0,
          paymentMethod: purchase.paymentMethod || 'cash',
          status: purchase.paymentReceived ? 'paid' : (purchase.status === 'approved' ? 'unpaid' : 'pending'),
          approvedAt: purchase.requestedAt,
          paidAt: purchase.paymentReceivedAt
        });
      }
    });

    // Get Pixel Tracking purchases
    const pixelFilter = {};
    if (salonId) pixelFilter.salonId = salonId;
    if (startDate || endDate) {
      pixelFilter['pixelTrackingPurchase.paymentReceivedAt'] = {};
      if (startDate) pixelFilter['pixelTrackingPurchase.paymentReceivedAt'].$gte = new Date(startDate);
      if (endDate) pixelFilter['pixelTrackingPurchase.paymentReceivedAt'].$lte = new Date(endDate);
    }

    if (status === 'paid') {
      pixelFilter['pixelTrackingPurchase.paymentReceived'] = true;
      pixelFilter['pixelTrackingPurchase.status'] = 'approved';
    } else if (status === 'unpaid') {
      pixelFilter['pixelTrackingPurchase.paymentReceived'] = false;
      pixelFilter['pixelTrackingPurchase.status'] = 'approved';
    } else if (status === 'pending') {
      pixelFilter['pixelTrackingPurchase.status'] = 'pending';
    }

    const pixelPurchases = await Subscription.find(pixelFilter)
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .sort({ 'pixelTrackingPurchase.paymentReceivedAt': -1, 'pixelTrackingPurchase.requestedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit) / 3)
      .lean();

    pixelPurchases.forEach(sub => {
      const purchase = sub.pixelTrackingPurchase;
      if (purchase && purchase.status === 'approved' && (purchase.paymentReceived || status === 'unpaid' || !status)) {
        transactions.push({
          _id: sub._id,
          transactionId: `PX-${sub._id}`,
          date: purchase.paymentReceivedAt || purchase.requestedAt,
          salonId: sub.salonId?._id,
          salonName: sub.salonId?.name,
          ownerName: sub.salonId ? sub.ownerId?.name : null,
          type: 'pixel_tracking',
          category: 'Pixel Tracking',
          amount: purchase.price || 15,
          paymentMethod: purchase.paymentMethod || 'cash',
          status: purchase.paymentReceived ? 'paid' : (purchase.status === 'approved' ? 'unpaid' : 'pending'),
          approvedAt: purchase.requestedAt,
          paidAt: purchase.paymentReceivedAt
        });
      }
    });

    // Get BillingHistory transactions (recurring payments)
    const billingFilter = {};
    if (salonId) billingFilter.salon = salonId;
    if (startDate || endDate) {
      billingFilter.paidAt = {};
      if (startDate) billingFilter.paidAt.$gte = new Date(startDate);
      if (endDate) billingFilter.paidAt.$lte = new Date(endDate);
    }
    if (status === 'paid') billingFilter.status = 'succeeded';
    else if (status === 'unpaid') billingFilter.status = { $in: ['pending', 'processing'] };

    const billingTransactions = await BillingHistory.find(billingFilter)
      .populate('salon', 'name')
      .populate({
        path: 'subscription',
        populate: { path: 'ownerId', select: 'name email phone' }
      })
      .sort({ paidAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit) / 3)
      .lean();

    billingTransactions.forEach(billing => {
      if (billing.status === 'succeeded' || !status || status === 'unpaid') {
        transactions.push({
          _id: billing._id,
          transactionId: billing.transactionId || `BILL-${billing._id}`,
          date: billing.paidAt || billing.createdAt,
          salonId: billing.salon?._id,
          salonName: billing.salon?.name,
          ownerName: billing.subscription?.ownerId?.name,
          type: 'recurring_billing',
          category: 'Recurring Subscription',
          plan: billing.subscription?.plan,
          amount: billing.amount,
          paymentMethod: billing.paymentMethod || 'cash',
          status: billing.status === 'succeeded' ? 'paid' : billing.status,
          approvedAt: billing.createdAt,
          paidAt: billing.paidAt,
          billingPeriod: billing.billingPeriod
        });
      }
    });

    // Sort all transactions by date (most recent first)
    transactions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // Filter by type if specified
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = transactions.filter(t => t.type === type);
    }

    // Get total count for pagination
    const total = filteredTransactions.length;
    const paginatedTransactions = filteredTransactions.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get financial summary per salon
 * @route   GET /api/super-admin/finance/salons
 * @access  Private (SuperAdmin)
 */
const getSalonsFinancialSummary = async (req, res, next) => {
  try {
    const { search, sortBy = 'totalSpent', sortOrder = 'desc' } = req.query;

    const salons = await Salon.find({ isActive: true })
      .populate('ownerId', 'name email phone')
      .lean();

    const salonFinancials = await Promise.all(
      salons.map(async (salon) => {
        const subscription = await Subscription.findOne({ salonId: salon._id }).lean();

        if (!subscription) {
          return {
            salonId: salon._id,
            salonName: salon.name,
            ownerName: salon.ownerId?.name,
            ownerEmail: salon.ownerId?.email,
            currentPlan: null,
            totalSpent: 0,
            planPayments: 0,
            whatsappPayments: 0,
            pixelPayments: 0,
            recurringPayments: 0,
            lastPaymentDate: null,
            outstandingAmount: 0
          };
        }

        // Calculate total spent from all sources
        let planPayments = 0;
        let whatsappPayments = 0;
        let pixelPayments = 0;
        let recurringPayments = 0;

        // Plan upgrade payments
        if (subscription.upgradePaymentReceived && subscription.upgradeStatus === 'approved') {
          planPayments = subscription.requestedPlanPrice || subscription.price || 0;
        }

        // WhatsApp credits payments
        if (subscription.whatsappCreditPurchase?.paymentReceived && subscription.whatsappCreditPurchase?.status === 'approved') {
          whatsappPayments = subscription.whatsappCreditPurchase.price || 0;
        }

        // Pixel Tracking payments
        if (subscription.pixelTrackingPurchase?.paymentReceived && subscription.pixelTrackingPurchase?.status === 'approved') {
          pixelPayments = subscription.pixelTrackingPurchase.price || 15;
        }

        // Recurring billing payments
        const billingPayments = await BillingHistory.aggregate([
          {
            $match: {
              salon: salon._id,
              status: 'succeeded'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        recurringPayments = billingPayments[0]?.total || 0;

        const totalSpent = planPayments + whatsappPayments + pixelPayments + recurringPayments;

        // Calculate outstanding amount
        let outstandingAmount = 0;
        if (subscription.upgradeStatus === 'approved' && !subscription.upgradePaymentReceived) {
          outstandingAmount += subscription.requestedPlanPrice || subscription.price || 0;
        }
        if (subscription.whatsappCreditPurchase?.status === 'approved' && !subscription.whatsappCreditPurchase?.paymentReceived) {
          outstandingAmount += subscription.whatsappCreditPurchase.price || 0;
        }
        if (subscription.pixelTrackingPurchase?.status === 'approved' && !subscription.pixelTrackingPurchase?.paymentReceived) {
          outstandingAmount += subscription.pixelTrackingPurchase.price || 15;
        }

        // Get last payment date
        let lastPaymentDate = null;
        if (subscription.upgradePaymentReceivedAt) lastPaymentDate = subscription.upgradePaymentReceivedAt;
        if (subscription.whatsappCreditPurchase?.paymentReceivedAt) {
          if (!lastPaymentDate || new Date(subscription.whatsappCreditPurchase.paymentReceivedAt) > new Date(lastPaymentDate)) {
            lastPaymentDate = subscription.whatsappCreditPurchase.paymentReceivedAt;
          }
        }
        if (subscription.pixelTrackingPurchase?.paymentReceivedAt) {
          if (!lastPaymentDate || new Date(subscription.pixelTrackingPurchase.paymentReceivedAt) > new Date(lastPaymentDate)) {
            lastPaymentDate = subscription.pixelTrackingPurchase.paymentReceivedAt;
          }
        }

        const lastBilling = await BillingHistory.findOne({ salon: salon._id, status: 'succeeded' })
          .sort({ paidAt: -1 })
          .lean();
        
        if (lastBilling?.paidAt) {
          if (!lastPaymentDate || new Date(lastBilling.paidAt) > new Date(lastPaymentDate)) {
            lastPaymentDate = lastBilling.paidAt;
          }
        }

        return {
          salonId: salon._id,
          salonName: salon.name,
          ownerName: salon.ownerId?.name,
          ownerEmail: salon.ownerId?.email,
          currentPlan: subscription.plan || subscription.requestedPlan,
          totalSpent,
          planPayments,
          whatsappPayments,
          pixelPayments,
          recurringPayments,
          lastPaymentDate,
          outstandingAmount,
          subscriptionStatus: subscription.status
        };
      })
    );

    // Filter by search term
    let filtered = salonFinancials;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = salonFinancials.filter(s => 
        s.salonName?.toLowerCase().includes(searchLower) ||
        s.ownerName?.toLowerCase().includes(searchLower) ||
        s.ownerEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      
      if (sortBy === 'lastPaymentDate') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    res.json({
      success: true,
      data: {
        salons: filtered,
        total: filtered.length,
        totalRevenue: filtered.reduce((sum, s) => sum + s.totalSpent, 0),
        totalOutstanding: filtered.reduce((sum, s) => sum + s.outstandingAmount, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon financial history
 * @route   GET /api/super-admin/finance/salons/:salonId/history
 * @access  Private (SuperAdmin)
 */
const getSalonFinancialHistory = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { startDate, endDate } = req.query;

    const subscription = await Subscription.findOne({ salonId })
      .populate('salonId', 'name')
      .populate('ownerId', 'name email phone')
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found for this salon'
      });
    }

    const transactions = [];

    // Plan upgrade transaction
    if (subscription.upgradeStatus === 'approved') {
      transactions.push({
        transactionId: `UPG-${subscription._id}`,
        date: subscription.upgradePaymentReceivedAt || subscription.upgradeRequestedAt,
        type: 'plan_upgrade',
        category: 'Subscription Plan',
        plan: subscription.plan || subscription.requestedPlan,
        amount: subscription.requestedPlanPrice || subscription.price || 0,
        paymentMethod: subscription.paymentMethod || 'cash',
        status: subscription.upgradePaymentReceived ? 'paid' : 'unpaid',
        approvedAt: subscription.upgradeRequestedAt,
        paidAt: subscription.upgradePaymentReceivedAt,
        billingInterval: subscription.requestedBillingInterval || subscription.billingInterval
      });
    }

    // WhatsApp credits transactions
    if (subscription.whatsappCreditPurchase?.status === 'approved') {
      transactions.push({
        transactionId: `WA-${subscription._id}`,
        date: subscription.whatsappCreditPurchase.paymentReceivedAt || subscription.whatsappCreditPurchase.requestedAt,
        type: 'whatsapp_credits',
        category: 'WhatsApp Credits',
        credits: subscription.whatsappCreditPurchase.credits,
        packageType: subscription.whatsappCreditPurchase.packageType,
        amount: subscription.whatsappCreditPurchase.price || 0,
        paymentMethod: subscription.whatsappCreditPurchase.paymentMethod || 'cash',
        status: subscription.whatsappCreditPurchase.paymentReceived ? 'paid' : 'unpaid',
        approvedAt: subscription.whatsappCreditPurchase.requestedAt,
        paidAt: subscription.whatsappCreditPurchase.paymentReceivedAt
      });
    }

    // Pixel Tracking transaction
    if (subscription.pixelTrackingPurchase?.status === 'approved') {
      transactions.push({
        transactionId: `PX-${subscription._id}`,
        date: subscription.pixelTrackingPurchase.paymentReceivedAt || subscription.pixelTrackingPurchase.requestedAt,
        type: 'pixel_tracking',
        category: 'Pixel Tracking',
        amount: subscription.pixelTrackingPurchase.price || 15,
        paymentMethod: subscription.pixelTrackingPurchase.paymentMethod || 'cash',
        status: subscription.pixelTrackingPurchase.paymentReceived ? 'paid' : 'unpaid',
        approvedAt: subscription.pixelTrackingPurchase.requestedAt,
        paidAt: subscription.pixelTrackingPurchase.paymentReceivedAt
      });
    }

    // BillingHistory transactions
    const billingFilter = { salon: salonId };
    if (startDate || endDate) {
      billingFilter.paidAt = {};
      if (startDate) billingFilter.paidAt.$gte = new Date(startDate);
      if (endDate) billingFilter.paidAt.$lte = new Date(endDate);
    }

    const billingTransactions = await BillingHistory.find(billingFilter)
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    billingTransactions.forEach(billing => {
      transactions.push({
        transactionId: billing.transactionId || `BILL-${billing._id}`,
        date: billing.paidAt || billing.createdAt,
        type: 'recurring_billing',
        category: 'Recurring Subscription',
        plan: subscription.plan,
        amount: billing.amount,
        paymentMethod: billing.paymentMethod || 'cash',
        status: billing.status === 'succeeded' ? 'paid' : billing.status,
        approvedAt: billing.createdAt,
        paidAt: billing.paidAt,
        billingPeriod: billing.billingPeriod
      });
    });

    // Sort by date
    transactions.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // Calculate totals
    const totalPaid = transactions
      .filter(t => t.status === 'paid')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const totalUnpaid = transactions
      .filter(t => t.status === 'unpaid')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    res.json({
      success: true,
      data: {
        salon: {
          id: subscription.salonId?._id,
          name: subscription.salonId?.name,
          owner: subscription.ownerId?.name,
          email: subscription.ownerId?.email,
          phone: subscription.ownerId?.phone
        },
        transactions,
        summary: {
          totalPaid,
          totalUnpaid,
          totalTransactions: transactions.length,
          paidTransactions: transactions.filter(t => t.status === 'paid').length,
          unpaidTransactions: transactions.filter(t => t.status === 'unpaid').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get revenue trends (monthly/yearly)
 * @route   GET /api/super-admin/finance/trends
 * @access  Private (SuperAdmin)
 */
const getRevenueTrends = async (req, res, next) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    const now = new Date();
    const trends = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // Get subscription revenue for this period
      const subRevenue = await Subscription.aggregate([
        {
          $match: {
            upgradePaymentReceived: true,
            upgradePaymentReceivedAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$requestedPlanPrice', '$price', 0] } }
          }
        }
      ]);

      // Get WhatsApp revenue
      const whatsappRevenue = await Subscription.aggregate([
        {
          $match: {
            'whatsappCreditPurchase.paymentReceived': true,
            'whatsappCreditPurchase.paymentReceivedAt': {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$whatsappCreditPurchase.price', 0] } }
          }
        }
      ]);

      // Get Pixel revenue
      const pixelRevenue = await Subscription.aggregate([
        {
          $match: {
            'pixelTrackingPurchase.paymentReceived': true,
            'pixelTrackingPurchase.paymentReceivedAt': {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$pixelTrackingPurchase.price', 15] } }
          }
        }
      ]);

      // Get billing revenue
      const billingRevenue = await BillingHistory.aggregate([
        {
          $match: {
            status: 'succeeded',
            paidAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const monthTotal = 
        (subRevenue[0]?.total || 0) +
        (whatsappRevenue[0]?.total || 0) +
        (pixelRevenue[0]?.total || 0) +
        (billingRevenue[0]?.total || 0);

      trends.push({
        period: startDate.toISOString().substring(0, 7), // YYYY-MM
        label: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        subscriptions: subRevenue[0]?.total || 0,
        whatsappCredits: whatsappRevenue[0]?.total || 0,
        pixelTracking: pixelRevenue[0]?.total || 0,
        recurringBilling: billingRevenue[0]?.total || 0,
        total: monthTotal
      });
    }

    res.json({
      success: true,
      data: { trends }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinancialOverview,
  getAllTransactions,
  getSalonsFinancialSummary,
  getSalonFinancialHistory,
  getRevenueTrends
};

