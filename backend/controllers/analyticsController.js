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

    // Revenue analytics
    const allPayments = await Payment.find({ salonId: salon._id, status: 'completed' });
    const todayPayments = await Payment.find({
      salonId: salon._id,
      status: 'completed',
      paidAt: { $gte: today, $lt: tomorrow }
    });
    const monthPayments = await Payment.find({
      salonId: salon._id,
      status: 'completed',
      paidAt: { $gte: firstDayOfMonth }
    });

    const totalRevenue = allPayments.reduce((sum, p) => sum + p.salonRevenue, 0);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.salonRevenue, 0);
    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.salonRevenue, 0);

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

    const payments = await Payment.find({
      salonId: salon._id,
      status: 'completed',
      paidAt: { $gte: startDate }
    });

    // Group by period
    const trends = {};
    payments.forEach(payment => {
      const date = new Date(payment.paidAt);
      let key;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${weekNum}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = { revenue: 0, count: 0 };
      }
      
      trends[key].revenue += payment.salonRevenue;
      trends[key].count += 1;
    });

    const trendsArray = Object.keys(trends).sort().map(key => ({
      period: key,
      revenue: trends[key].revenue,
      count: trends[key].count,
      average: trends[key].revenue / trends[key].count
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

    // Get revenue
    const paymentFilter = { ...filter, status: 'completed' };
    if (Object.keys(dateFilter).length > 0) {
      paymentFilter.paidAt = dateFilter;
    }
    
    const payments = await Payment.find(paymentFilter);
    const totalRevenue = payments.reduce((sum, p) => sum + p.salonRevenue, 0);

    // Get expenses
    const expenseFilter = { ...filter, isPaid: true };
    if (Object.keys(dateFilter).length > 0) {
      expenseFilter.date = dateFilter;
    }
    
    const expenses = await Expense.find(expenseFilter);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit,
        profitMargin: profitMargin.toFixed(2),
        paymentCount: payments.length,
        expenseCount: expenses.length
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

