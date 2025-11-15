const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Service = require('../models/Service');
const WorkerEarning = require('../models/WorkerEarning');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * @desc    Get comprehensive business reports
 * @route   GET /api/reports
 * @access  Private (Owner)
 */
const getBusinessReports = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = salonData.salonId;

    // Date range (default: last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 1. REVENUE TRENDS (Daily revenue for the period)
    const revenueTrends = await Payment.aggregate([
      {
        $match: {
          salonId,
          status: 'completed',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. SERVICE POPULARITY (Most booked services)
    const servicePopularity = await Appointment.aggregate([
      {
        $match: {
          salonId,
          status: { $in: ['Completed', 'Confirmed', 'In Progress'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$serviceId',
          count: { $sum: 1 },
          revenue: { $sum: '$servicePriceAtBooking' }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      { $unwind: '$service' },
      {
        $project: {
          serviceName: '$service.name',
          count: 1,
          revenue: 1
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. APPOINTMENT STATUS DISTRIBUTION
    const appointmentStats = await Appointment.aggregate([
      {
        $match: {
          salonId,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. PEAK HOURS ANALYSIS (Appointments by hour)
    const peakHours = await Appointment.aggregate([
      {
        $match: {
          salonId,
          status: { $in: ['Completed', 'Confirmed', 'In Progress'] },
          dateTime: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $hour: '$dateTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 5. WORKER PERFORMANCE
    const workerPerformance = await Appointment.aggregate([
      {
        $match: {
          salonId,
          status: 'Completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$workerId',
          completedAppointments: { $sum: 1 },
          totalRevenue: { $sum: '$servicePriceAtBooking' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: '$worker' },
      {
        $project: {
          workerName: '$worker.name',
          completedAppointments: 1,
          totalRevenue: 1,
          averagePerService: {
            $divide: ['$totalRevenue', '$completedAppointments']
          }
        }
      },
      { $sort: { completedAppointments: -1 } }
    ]);

    // 6. DAILY BREAKDOWN (Day of week analysis)
    const dayOfWeekStats = await Appointment.aggregate([
      {
        $match: {
          salonId,
          status: 'Completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$dateTime' },
          count: { $sum: 1 },
          revenue: { $sum: '$servicePriceAtBooking' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 7. TOP CLIENTS (Most frequent visitors)
    const topClients = await Appointment.aggregate([
      {
        $match: {
          salonId,
          status: 'Completed',
          completedAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$clientId',
          visits: { $sum: 1 },
          totalSpent: { $sum: '$servicePriceAtBooking' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      { $unwind: '$client' },
      {
        $project: {
          clientName: '$client.name',
          visits: 1,
          totalSpent: 1,
          averageSpent: {
            $divide: ['$totalSpent', '$visits']
          }
        }
      },
      { $sort: { visits: -1 } },
      { $limit: 10 }
    ]);

    // 8. SUMMARY STATISTICS
    const totalRevenue = await Payment.aggregate([
      {
        $match: {
          salonId,
          status: 'completed',
          paidAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          salonRevenue: { $sum: '$salonRevenue' },
          workerCommissions: { $sum: '$workerCommission.amount' }
        }
      }
    ]);

    const totalAppointments = await Appointment.countDocuments({
      salonId,
      createdAt: { $gte: start, $lte: end }
    });

    const completedAppointments = await Appointment.countDocuments({
      salonId,
      status: 'Completed',
      completedAt: { $gte: start, $lte: end }
    });

    const cancelledAppointments = await Appointment.countDocuments({
      salonId,
      status: 'Cancelled',
      createdAt: { $gte: start, $lte: end }
    });

    // Calculate conversion rate
    const conversionRate = totalAppointments > 0 
      ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        dateRange: {
          start,
          end
        },
        summary: {
          totalRevenue: totalRevenue[0]?.total || 0,
          salonRevenue: totalRevenue[0]?.salonRevenue || 0,
          workerCommissions: totalRevenue[0]?.workerCommissions || 0,
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          conversionRate: parseFloat(conversionRate),
          averageRevenuePerAppointment: completedAppointments > 0
            ? (totalRevenue[0]?.total || 0) / completedAppointments
            : 0
        },
        charts: {
          revenueTrends,
          servicePopularity,
          appointmentStats,
          peakHours,
          workerPerformance,
          dayOfWeekStats,
          topClients
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBusinessReports
};
