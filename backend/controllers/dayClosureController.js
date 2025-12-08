const DayClosure = require('../models/DayClosure');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

/**
 * @desc    Close the day - finalize daily operations
 * @route   POST /api/day-closure/close
 * @access  Private (Owner only)
 */
const closeTheDay = async (req, res, next) => {
  try {
    const { date, notes, actualCash } = req.body;
    const closureDate = date ? new Date(date) : new Date();
    closureDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(closureDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get owner's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Check if day already closed
    const existingClosure = await DayClosure.findOne({
      salonId: salon._id,
      date: closureDate
    });

    if (existingClosure) {
      return res.status(400).json({
        success: false,
        message: 'Day has already been closed'
      });
    }

    // Get all appointments for the day
    const appointments = await Appointment.find({
      salonId: salon._id,
      dateTime: { $gte: closureDate, $lt: nextDay }
    }).populate('workerId serviceId');

    // Get all payments for the day
    const payments = await Payment.find({
      salonId: salon._id,
      paidAt: { $gte: closureDate, $lt: nextDay },
      status: 'completed'
    });

    // Get all expenses for the day
    const expenses = await Expense.find({
      salonId: salon._id,
      date: { $gte: closureDate, $lt: nextDay }
    });

    // Calculate financial summary
    const totalRevenue = payments.reduce((sum, p) => sum + p.salonRevenue, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Appointment summary
    const appointmentSummary = {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'pending').length // Pending = no-show
    };

    // Payment summary with amounts
    const paymentSummary = {
      total: payments.length,
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      bank_transfer: { count: 0, amount: 0 },
      online: { count: 0, amount: 0 },
      wallet: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    };

    payments.forEach(payment => {
      const method = payment.paymentMethod || 'other';
      if (paymentSummary[method]) {
        paymentSummary[method].count += 1;
        paymentSummary[method].amount += payment.amount;
      } else {
        paymentSummary.other.count += 1;
        paymentSummary.other.amount += payment.amount;
      }
    });

    // Calculate cash total from payments
    const calculatedCash = paymentSummary.cash.amount;

    // Worker performance
    const workerStats = {};
    payments.forEach(payment => {
      const workerId = payment.workerId.toString();
      if (!workerStats[workerId]) {
        workerStats[workerId] = {
          workerId: payment.workerId,
          appointmentsCompleted: 0,
          revenue: 0,
          commission: 0
        };
      }
      workerStats[workerId].appointmentsCompleted += 1;
      workerStats[workerId].revenue += payment.amount;
      workerStats[workerId].commission += payment.workerCommission.amount;
    });

    // Get worker names
    const workerPerformance = await Promise.all(
      Object.values(workerStats).map(async (stats) => {
        const worker = await require('../models/User').findById(stats.workerId);
        return {
          ...stats,
          workerName: worker?.name || 'Unknown'
        };
      })
    );

    // Top services
    const serviceStats = {};
    appointments.filter(a => a.status === 'completed').forEach(apt => {
      const serviceId = apt.serviceId?._id.toString();
      if (serviceId) {
        if (!serviceStats[serviceId]) {
          serviceStats[serviceId] = {
            serviceId: apt.serviceId._id,
            serviceName: apt.serviceId.name,
            count: 0,
            revenue: 0
          };
        }
        serviceStats[serviceId].count += 1;
        serviceStats[serviceId].revenue += apt.servicePriceAtBooking;
      }
    });

    const topServices = Object.values(serviceStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate cash verification
    const cashVerification = {
      calculatedCash: calculatedCash,
      actualCash: actualCash !== undefined && actualCash !== null ? parseFloat(actualCash) : null,
      discrepancy: actualCash !== undefined && actualCash !== null 
        ? parseFloat(actualCash) - calculatedCash 
        : 0,
      verified: actualCash !== undefined && actualCash !== null
    };

    // Create day closure record
    const dayClosure = await DayClosure.create({
      salonId: salon._id,
      date: closureDate,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: profitMargin.toFixed(2)
      },
      appointments: appointmentSummary,
      payments: paymentSummary,
      cashVerification,
      workerPerformance,
      topServices,
      notes: notes || '',
      closedBy: req.user.id
    });

    // Mark no-show appointments
    await Appointment.updateMany(
      {
        salonId: salon._id,
        dateTime: { $gte: closureDate, $lt: nextDay },
        status: 'pending'
      },
      { status: 'no-show' }
    );

    // TODO: Send daily summary notification to owner
    // const notificationService = require('../services/notificationService');
    // await notificationService.sendDailySummary(owner, dayClosure);

    res.json({
      success: true,
      message: 'Day closed successfully',
      data: { dayClosure }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get day closures history
 * @route   GET /api/day-closure/history
 * @access  Private (Owner)
 */
const getDayClosureHistory = async (req, res, next) => {
  try {
    const { limit = 30 } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        data: { closures: [] }
      });
    }

    const closures = await DayClosure.find({ salonId: salon._id })
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: closures.length,
      data: { closures }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific day closure
 * @route   GET /api/day-closure/:date
 * @access  Private (Owner)
 */
const getDayClosure = async (req, res, next) => {
  try {
    const { date } = req.params;
    const closureDate = new Date(date);
    closureDate.setHours(0, 0, 0, 0);

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const closure = await DayClosure.findOne({
      salonId: salon._id,
      date: closureDate
    });

    if (!closure) {
      return res.status(404).json({
        success: false,
        message: 'Day closure not found'
      });
    }

    res.json({
      success: true,
      data: { closure }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  closeTheDay,
  getDayClosureHistory,
  getDayClosure
};

