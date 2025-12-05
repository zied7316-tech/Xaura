const Payment = require('../models/Payment');
const WorkerEarning = require('../models/WorkerEarning');
const Expense = require('../models/Expense');
const Salon = require('../models/Salon');
const User = require('../models/User');

/**
 * @desc    Get finance dashboard data for a date range
 * @route   GET /api/finance/dashboard
 * @access  Private (Owner)
 */
const getFinanceDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Get salon
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Parse dates - default to today if not provided
    let start, end;
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      const today = new Date();
      start = new Date(today);
      start.setHours(0, 0, 0, 0);
      end = new Date(today);
      end.setHours(23, 59, 59, 999);
    }

    // Build date filter
    const dateFilter = {
      $gte: start,
      $lte: end
    };

    // 1. Get all payments in date range
    const payments = await Payment.find({
      salonId: salon._id,
      status: 'completed',
      paidAt: dateFilter
    })
      .populate('workerId', 'name email')
      .populate('clientId', 'name email phone')
      .populate('appointmentId', 'dateTime serviceId')
      .sort({ paidAt: -1 });

    // 2. Get all worker earnings in date range
    const workerEarnings = await WorkerEarning.find({
      salonId: salon._id,
      serviceDate: dateFilter
    })
      .populate('workerId', 'name email')
      .populate('serviceId', 'name')
      .populate('appointmentId', 'dateTime')
      .sort({ serviceDate: -1 });

    // 3. Get all expenses in date range
    const expenses = await Expense.find({
      salonId: salon._id,
      date: dateFilter
    }).sort({ date: -1 });

    // 4. Calculate summary cards
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalWorkerEarnings = workerEarnings.reduce((sum, e) => sum + e.workerEarning, 0);
    const totalSalonRevenue = payments.reduce((sum, p) => sum + p.salonRevenue, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalSalonRevenue - totalExpenses;

    // 5. Worker breakdown - group earnings by worker
    const workerBreakdownMap = new Map();
    
    workerEarnings.forEach(earning => {
      const workerId = earning.workerId._id.toString();
      if (!workerBreakdownMap.has(workerId)) {
        workerBreakdownMap.set(workerId, {
          workerId: earning.workerId._id,
          workerName: earning.workerId.name,
          workerEmail: earning.workerId.email,
          totalEarnings: 0,
          servicesCount: 0,
          earnings: []
        });
      }
      
      const workerData = workerBreakdownMap.get(workerId);
      workerData.totalEarnings += earning.workerEarning;
      workerData.servicesCount += 1;
      workerData.earnings.push({
        serviceName: earning.serviceId?.name || 'Service',
        serviceDate: earning.serviceDate,
        servicePrice: earning.servicePrice,
        workerEarning: earning.workerEarning,
        commissionPercentage: earning.commissionPercentage,
        isPaid: earning.isPaid
      });
    });

    const workerBreakdown = Array.from(workerBreakdownMap.values());

    // 6. Detailed transactions list (combine payments and expenses)
    const transactions = [
      ...payments.map(payment => ({
        id: payment._id,
        type: 'payment',
        date: payment.paidAt,
        description: `Payment from ${payment.clientId?.name || 'Client'}`,
        amount: payment.amount,
        workerName: payment.workerId?.name,
        paymentMethod: payment.paymentMethod,
        workerCommission: payment.workerCommission.amount,
        salonRevenue: payment.salonRevenue,
        status: payment.status
      })),
      ...expenses.map(expense => ({
        id: expense._id,
        type: 'expense',
        date: expense.date,
        description: expense.description || expense.category,
        amount: -expense.amount, // Negative for expenses
        category: expense.category,
        vendor: expense.vendor,
        status: 'completed'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // 7. Additional metrics
    const paymentCount = payments.length;
    const expenseCount = expenses.length;
    const averageTransaction = paymentCount > 0 ? totalRevenue / paymentCount : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        summary: {
          totalRevenue,
          totalWorkerEarnings,
          totalSalonRevenue,
          totalExpenses,
          netProfit,
          profitMargin: parseFloat(profitMargin.toFixed(2)),
          paymentCount,
          expenseCount,
          averageTransaction: parseFloat(averageTransaction.toFixed(2))
        },
        workerBreakdown,
        transactions,
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
          workerName: p.workerId?.name,
          clientName: p.clientId?.name,
          workerCommission: p.workerCommission.amount,
          salonRevenue: p.salonRevenue,
          status: p.status
        })),
        expenses: expenses.map(e => ({
          id: e._id,
          amount: e.amount,
          category: e.category,
          description: e.description,
          vendor: e.vendor,
          date: e.date
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFinanceDashboard
};

