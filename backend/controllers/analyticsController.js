const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Customer = require('../models/Customer');
const Salon = require('../models/Salon');
const User = require('../models/User');

/**
 * @desc    Get business dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private (Owner)
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    
    if (!salon) {
      return res.json({
        success: true,
        data: {
          revenue: { total: 0, today: 0, thisMonth: 0 },
          appointments: { total: 0, today: 0, pending: 0, completed: 0 },
          customers: { total: 0, new: 0, returning: 0 },
          workers: { total: 0, active: 0 }
        }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Revenue analytics - Use aggregation for better performance
    const [totalRevenueResult, todayRevenueResult, monthRevenueResult] = await Promise.all([
      Payment.aggregate([
        { $match: { salonId: salon._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$salonRevenue' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            salonId: salon._id, 
            status: 'completed',
            paidAt: { $gte: today, $lt: tomorrow }
          } 
        },
        { $group: { _id: null, total: { $sum: '$salonRevenue' } } }
      ]),
      Payment.aggregate([
        { 
          $match: { 
            salonId: salon._id, 
            status: 'completed',
            paidAt: { $gte: firstDayOfMonth }
          } 
        },
        { $group: { _id: null, total: { $sum: '$salonRevenue' } } }
      ])
    ]);

    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const todayRevenue = todayRevenueResult[0]?.total || 0;
    const monthRevenue = monthRevenueResult[0]?.total || 0;

    // Appointment analytics
    const totalAppointments = await Appointment.countDocuments({ salonId: salon._id });
    const todayAppointments = await Appointment.countDocuments({
      salonId: salon._id,
      dateTime: { $gte: today, $lt: tomorrow }
    });
    const pendingAppointments = await Appointment.countDocuments({
      salonId: salon._id,
      status: 'pending'
    });
    const completedAppointments = await Appointment.countDocuments({
      salonId: salon._id,
      status: 'completed'
    });

    // Customer analytics
    const totalCustomers = await Customer.countDocuments({ salonId: salon._id });
    const newCustomers = await Customer.countDocuments({
      salonId: salon._id,
      firstVisit: { $gte: firstDayOfMonth }
    });
    const returningCustomers = await Customer.countDocuments({
      salonId: salon._id,
      totalVisits: { $gt: 1 }
    });

    // Worker analytics
    const totalWorkers = await User.countDocuments({
      salonId: salon._id,
      role: 'Worker'
    });
    const activeWorkers = await User.countDocuments({
      salonId: salon._id,
      role: 'Worker',
      isActive: true
    });

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisMonth: monthRevenue
        },
        appointments: {
          total: totalAppointments,
          today: todayAppointments,
          pending: pendingAppointments,
          completed: completedAppointments
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
          returning: returningCustomers
        },
        workers: {
          total: totalWorkers,
          active: activeWorkers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get revenue trends
 * @route   GET /api/analytics/revenue-trends
 * @access  Private (Owner)
 */
const getRevenueTrends = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({ success: true, data: { trends: [] } });
    }

    // Get last 30 days, 12 weeks, 12 months based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 84)); // 12 weeks
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 12));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 12));
    }

    // Use aggregation pipeline for better performance
    let groupFormat;
    if (period === 'day') {
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } };
    } else if (period === 'week') {
      groupFormat = { 
        $concat: [
          { $toString: { $year: '$paidAt' } },
          '-W',
          { $toString: { $ceil: { $divide: [{ $dayOfMonth: '$paidAt' }, 7] } } }
        ]
      };
    } else {
      groupFormat = { 
        $concat: [
          { $toString: { $year: '$paidAt' } },
          '-',
          { $cond: [
            { $lt: [{ $month: '$paidAt' }, 10] },
            { $concat: ['0', { $toString: { $month: '$paidAt' } }] },
            { $toString: { $month: '$paidAt' } }
          ]}
        ]
      };
    }

    const trendsData = await Payment.aggregate([
      {
        $match: {
          salonId: salon._id,
          status: 'completed',
          paidAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$salonRevenue' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          period: '$_id',
          revenue: 1,
          count: 1,
          average: { $divide: ['$revenue', '$count'] }
        }
      },
      { $sort: { period: 1 } }
    ]);

    const trendsArray = trendsData.map(item => ({
      period: item.period,
      revenue: item.revenue,
      count: item.count,
      average: item.average
    }));

    res.json({
      success: true,
      data: { trends: trendsArray }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profit/loss summary
 * @route   GET /api/analytics/profit-loss
 * @access  Private (Owner)
 */
const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        data: { revenue: 0, expenses: 0, profit: 0 }
      });
    }

    const filter = { salonId: salon._id };
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get revenue using aggregation
    const paymentMatch = { ...filter, status: 'completed' };
    if (Object.keys(dateFilter).length > 0) {
      paymentMatch.paidAt = dateFilter;
    }
    
    const revenueResult = await Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, total: { $sum: '$salonRevenue' }, count: { $sum: 1 } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;
    const paymentCount = revenueResult[0]?.count || 0;

    // Get expenses using aggregation
    const expenseMatch = { ...filter, isPaid: true };
    if (Object.keys(dateFilter).length > 0) {
      expenseMatch.date = dateFilter;
    }
    
    const expenseResult = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalExpenses = expenseResult[0]?.total || 0;
    const expenseCount = expenseResult[0]?.count || 0;

    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit,
        profitMargin: profitMargin.toFixed(2),
        paymentCount: paymentCount,
        expenseCount: expenseCount
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getRevenueTrends,
  getProfitLoss
};

