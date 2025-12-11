const mongoose = require('mongoose');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Service = require('../models/Service');
const Product = require('../models/Product');
const ProductHistory = require('../models/ProductHistory');
const ProductSale = require('../models/ProductSale');
const SalonClient = require('../models/SalonClient');
const Review = require('../models/Review');
const LoyaltyProgram = require('../models/LoyaltyProgram');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const WorkerEarning = require('../models/WorkerEarning');
const WorkerInvoice = require('../models/WorkerInvoice');
const WorkerAdvance = require('../models/WorkerAdvance');
const WorkerWallet = require('../models/WorkerWallet');
const Commission = require('../models/Commission');
const Expense = require('../models/Expense');
const DayClosure = require('../models/DayClosure');
const RecurringAppointment = require('../models/RecurringAppointment');
const GroupBooking = require('../models/GroupBooking');
const WorkerAvailability = require('../models/WorkerAvailability');
const WorkerStatusLog = require('../models/WorkerStatusLog');
const GPSTrackingLog = require('../models/GPSTrackingLog');
const ReminderSettings = require('../models/ReminderSettings');
const EmailCampaign = require('../models/EmailCampaign');
const Notification = require('../models/Notification');
const CustomerProfile = require('../models/CustomerProfile');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const PaymentMethod = require('../models/PaymentMethod');
const SalonOwnership = require('../models/SalonOwnership');
const ChatMessage = require('../models/ChatMessage');
const ActivityLog = require('../models/ActivityLog');
const UserHistory = require('../models/UserHistory');
const { createActivityLog } = require('../middleware/activityLogger');

/**
 * @desc    Get platform-wide statistics
 * @route   GET /api/super-admin/dashboard
 * @access  Private (SuperAdmin)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Total counts
    const totalSalons = await Salon.countDocuments({ isActive: true });
    const totalOwners = await User.countDocuments({ role: 'Owner' });
    const totalWorkers = await User.countDocuments({ role: 'Worker' });
    const totalClients = await User.countDocuments({ role: 'Client' });
    const totalAppointments = await Appointment.countDocuments();

    // Revenue statistics (all salons)
    const revenueStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amount' }
        }
      }
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      totalPayments: 0,
      avgPayment: 0
    };

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await Appointment.countDocuments({
      createdAt: { $gte: today }
    });

    const todayRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // This month stats
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const thisMonthAppointments = await Appointment.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });

    const thisMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: thisMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Growth rate (new salons this month)
    const newSalonsThisMonth = await Salon.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({
      status: { $in: ['trial', 'active'] }
    });

    // Platform revenue from subscriptions
    const subscriptionRevenue = await Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          monthlyRecurring: { $sum: '$monthlyFee' },
          totalRevenue: { $sum: '$totalRevenue' }
        }
      }
    ]);

    const subRevenue = subscriptionRevenue[0] || {
      monthlyRecurring: 0,
      totalRevenue: 0
    };

    res.json({
      success: true,
      data: {
        overview: {
          totalSalons,
          totalOwners,
          totalWorkers,
          totalClients,
          totalUsers: totalOwners + totalWorkers + totalClients,
          totalAppointments
        },
        revenue: {
          platform: {
            totalRevenue: revenue.totalRevenue,
            totalPayments: revenue.totalPayments,
            avgPayment: revenue.avgPayment
          },
          subscriptions: {
            monthlyRecurring: subRevenue.monthlyRecurring,
            totalRevenue: subRevenue.totalRevenue,
            activeSubscriptions
          },
          today: {
            appointments: todayAppointments,
            revenue: todayRevenue[0]?.total || 0
          },
          thisMonth: {
            appointments: thisMonthAppointments,
            revenue: thisMonthRevenue[0]?.total || 0,
            newSalons: newSalonsThisMonth
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all salons (for management)
 * @route   GET /api/super-admin/salons
 * @access  Private (SuperAdmin)
 */
const getAllSalons = async (req, res, next) => {
  try {
    const salons = await Salon.find()
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    if (salons.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }

    const salonIds = salons.map(s => s._id);

    // Batch fetch all stats using aggregation - much faster than individual queries
    const [workerCounts, appointmentCounts, completedCounts, revenueData, subscriptions] = await Promise.all([
      // Worker counts per salon
      User.aggregate([
        { $match: { salonId: { $in: salonIds }, role: 'Worker' } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]),
      // Total appointment counts per salon
      Appointment.aggregate([
        { $match: { salonId: { $in: salonIds } } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]),
      // Completed appointment counts per salon
      Appointment.aggregate([
        { $match: { salonId: { $in: salonIds }, status: 'Completed' } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } }
      ]),
      // Revenue per salon
      Payment.aggregate([
        { $match: { salonId: { $in: salonIds }, status: 'completed' } },
        { $group: { _id: '$salonId', total: { $sum: '$amount' } } }
      ]),
      // Subscriptions per salon
      Subscription.find({ salonId: { $in: salonIds } }).lean()
    ]);

    // Create lookup maps for O(1) access
    const workerCountMap = new Map(workerCounts.map(w => [w._id.toString(), w.count]));
    const appointmentCountMap = new Map(appointmentCounts.map(a => [a._id.toString(), a.count]));
    const completedCountMap = new Map(completedCounts.map(c => [c._id.toString(), c.count]));
    const revenueMap = new Map(revenueData.map(r => [r._id.toString(), r.total]));
    const subscriptionMap = new Map(subscriptions.map(s => [s.salonId.toString(), s]));

    // Combine data
    const salonsWithStats = salons.map(salon => {
      const salonIdStr = salon._id.toString();
      return {
        ...salon,
        stats: {
          workers: workerCountMap.get(salonIdStr) || 0,
          appointments: appointmentCountMap.get(salonIdStr) || 0,
          completed: completedCountMap.get(salonIdStr) || 0,
          revenue: revenueMap.get(salonIdStr) || 0
        },
        subscription: subscriptionMap.get(salonIdStr) || null
      };
    });

    res.json({
      success: true,
      count: salons.length,
      data: salonsWithStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend/Activate salon
 * @route   PUT /api/super-admin/salons/:id/status
 * @access  Private (SuperAdmin)
 */
const updateSalonStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Log activity
    await createActivityLog(
      req,
      isActive ? 'salon_activated' : 'salon_suspended',
      'Salon',
      salon._id,
      salon.name,
      { previousStatus: !isActive, newStatus: isActive }
    );

    res.json({
      success: true,
      message: `Salon ${isActive ? 'activated' : 'suspended'} successfully`,
      data: salon
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users across platform
 * @route   GET /api/super-admin/users
 * @access  Private (SuperAdmin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, status, page = 1, limit = 50 } = req.query;
    
    let query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Filter by active status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const users = await User.find(query)
      .populate('salonId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user details with activity
 * @route   GET /api/super-admin/users/:id
 * @access  Private (SuperAdmin)
 */
const getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('salonId', 'name address services');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's recent appointments
    const Appointment = require('../models/Appointment');
    const recentAppointments = await Appointment.find({
      $or: [
        { clientId: user._id },
        { workerId: user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('salonId', 'name')
      .populate('serviceId', 'name price');

    // Get user's payment history if client or worker
    const Payment = require('../models/Payment');
    let payments = [];
    if (user.role === 'Client') {
      payments = await Payment.find({ clientId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    } else if (user.role === 'Worker') {
      payments = await Payment.find({ workerId: user._id })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    // Get comprehensive user history
    const UserHistory = require('../models/UserHistory');
    const history = await UserHistory.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate statistics based on role
    let stats = {
      totalAppointments: await Appointment.countDocuments({
        $or: [
          { clientId: user._id },
          { workerId: user._id }
        ]
      })
    };

    if (user.role === 'Client') {
      // Client-specific stats
      const allAppointments = await Appointment.find({ clientId: user._id })
        .populate('salonId', 'name')
        .populate('workerId', 'name');
      
      const uniqueSalons = new Set();
      const uniqueBarbers = new Set();
      allAppointments.forEach(apt => {
        if (apt.salonId) uniqueSalons.add(apt.salonId._id.toString());
        if (apt.workerId) uniqueBarbers.add(apt.workerId._id.toString());
      });

      stats.totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
      stats.salonsVisited = uniqueSalons.size;
      stats.barbersVisited = uniqueBarbers.size;
      stats.totalAppointments = allAppointments.length;
    } else if (user.role === 'Worker') {
      // Worker-specific stats
      const allAppointments = await Appointment.find({ workerId: user._id })
        .populate('salonId', 'name');
      
      const uniqueSalons = new Set();
      allAppointments.forEach(apt => {
        if (apt.salonId) uniqueSalons.add(apt.salonId._id.toString());
      });

      stats.totalEarned = payments.reduce((sum, p) => sum + (p.workerCommission?.amount || 0), 0);
      stats.salonsWorkedWith = uniqueSalons.size;
      stats.completedAppointments = allAppointments.filter(a => a.status === 'completed').length;
      stats.totalAppointments = allAppointments.length;
    } else if (user.role === 'Owner') {
      // Owner-specific stats
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ ownerId: user._id })
        .populate('salonId', 'name');
      
      const Worker = require('../models/User');
      const workers = await Worker.find({ salonId: user.salonId?._id, role: 'Worker' });
      
      stats.currentPlan = subscription?.plan || 'Trial';
      stats.totalWorkers = workers.length;
      stats.activeWorkers = workers.filter(w => w.isActive).length;
    }

    res.json({
      success: true,
      data: {
        user,
        recentAppointments,
        payments,
        history,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Ban/Unban user
 * @route   PUT /api/super-admin/users/:id/status
 * @access  Private (SuperAdmin)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log activity
    await createActivityLog(
      req,
      isActive ? 'user_unbanned' : 'user_banned',
      'User',
      user._id,
      user.name,
      { email: user.email, role: user.role, previousStatus: !isActive, newStatus: isActive }
    );

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'banned'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (hard delete with cascade)
 * @route   DELETE /api/super-admin/users/:id
 * @access  Private (SuperAdmin)
 */
const deleteUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting other SuperAdmins
    if (user.role === 'SuperAdmin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Cannot delete Super Admin users'
      });
    }

    // Store original data for logging
    const userName = user.name;
    const userEmail = user.email;
    const userRole = user.role;

    // If deleting an Owner, cascade delete all associated data
    if (user.role === 'Owner') {
      // Find all salons owned by this user
      const salons = await Salon.find({ ownerId: user._id }).session(session);
      const salonIds = salons.map(salon => salon._id);

      // Delete all data associated with these salons
      if (salonIds.length > 0) {
        // Delete appointments
        await Appointment.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete services
        await Service.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete products
        await Product.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete product history
        await ProductHistory.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete product sales
        await ProductSale.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete subscriptions
        await Subscription.deleteMany({ ownerId: user._id }).session(session);
        
        // Delete salon clients
        await SalonClient.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete payments
        await Payment.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete reviews
        await Review.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete loyalty programs
        await LoyaltyProgram.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete loyalty transactions
        await LoyaltyTransaction.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker earnings
        await WorkerEarning.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker invoices
        await WorkerInvoice.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker advances
        await WorkerAdvance.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker wallets
        await WorkerWallet.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete commissions
        await Commission.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete expenses
        await Expense.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete day closures
        await DayClosure.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete recurring appointments
        await RecurringAppointment.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete group bookings
        await GroupBooking.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker availability
        await WorkerAvailability.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete worker status logs
        await WorkerStatusLog.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete GPS tracking logs
        await GPSTrackingLog.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete reminders
        await ReminderSettings.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete email campaigns
        await EmailCampaign.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete notifications
        await Notification.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete customer profiles
        await CustomerProfile.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete customers
        await Customer.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete inventory
        await Inventory.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete payment methods
        await PaymentMethod.deleteMany({ salonId: { $in: salonIds } }).session(session);
        
        // Delete salon ownership records
        await SalonOwnership.deleteMany({ salon: { $in: salonIds } }).session(session);
        
        // Disassociate workers from these salons (but don't delete them)
        const workers = await User.find({ salonId: { $in: salonIds }, role: 'Worker' }).session(session);
        const workerIds = workers.map(w => w._id);
        
        if (workerIds.length > 0) {
          // Remove salon association from workers (set salonId to null)
          await User.updateMany(
            { _id: { $in: workerIds } },
            { $set: { salonId: null } }
          ).session(session);
          
          // Remove workers from service assignments in these salons
          await Service.updateMany(
            { salonId: { $in: salonIds } },
            { $pullAll: { assignedWorkers: workerIds } }
          ).session(session);
          
          // Note: Salon-specific worker data (earnings, availability, etc.) 
          // is already deleted above by salonId (lines 596-629)
          // Appointments at these salons are already deleted above (line 563)
          // Workers themselves are kept and can join other salons
        }
        
        // Finally, delete the salons
        await Salon.deleteMany({ _id: { $in: salonIds } }).session(session);
      }
    } else if (user.role === 'Worker') {
      // If deleting a Worker, clean up worker-specific data
      const workerId = user._id;
      
      // Delete worker-related appointments
      await Appointment.deleteMany({ workerId }).session(session);
      
      // Delete worker-related data
      await WorkerEarning.deleteMany({ workerId }).session(session);
      await WorkerInvoice.deleteMany({ workerId }).session(session);
      await WorkerAdvance.deleteMany({ workerId }).session(session);
      await WorkerWallet.deleteMany({ workerId }).session(session);
      await Commission.deleteMany({ workerId }).session(session);
      await WorkerAvailability.deleteMany({ workerId }).session(session);
      await WorkerStatusLog.deleteMany({ workerId }).session(session);
      await GPSTrackingLog.deleteMany({ workerId }).session(session);
      
      // Remove worker from service assignments
      await Service.updateMany(
        { assignedWorkers: workerId },
        { $pull: { assignedWorkers: workerId } }
      ).session(session);
    } else if (user.role === 'Client') {
      // If deleting a Client, clean up client-specific data
      const clientId = user._id;
      
      // Delete client appointments
      await Appointment.deleteMany({ clientId }).session(session);
      
      // Delete recurring appointments
      await RecurringAppointment.deleteMany({ clientId }).session(session);
      
      // Delete group bookings
      await GroupBooking.deleteMany({ clientId }).session(session);
      
      // Delete salon client relationships
      await SalonClient.deleteMany({ clientId }).session(session);
      
      // Delete customer profiles
      await CustomerProfile.deleteMany({ clientId }).session(session);
      
      // Delete reviews
      await Review.deleteMany({ clientId }).session(session);
      
      // Delete loyalty transactions
      await LoyaltyTransaction.deleteMany({ clientId }).session(session);
      
      // Delete chat messages
      await ChatMessage.deleteMany({ senderId: clientId }).session(session);
      
      // Delete notifications
      await Notification.deleteMany({ userId: clientId }).session(session);
    }

    // Delete user-related data (for all roles)
    await ChatMessage.deleteMany({ senderId: user._id }).session(session);
    await Notification.deleteMany({ userId: user._id }).session(session);
    // Note: ActivityLog entries are kept for historical records (they reference targetId, not userId)
    await UserHistory.deleteMany({ userId: user._id }).session(session);

    // Log activity BEFORE deleting the user (so we can reference it)
    await createActivityLog(
      req,
      'user_deleted',
      'User',
      user._id,
      userName,
      { email: userEmail, role: userRole }
    );

    // Finally, delete the user
    await User.deleteOne({ _id: user._id }).session(session);

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get platform growth analytics
 * @route   GET /api/super-admin/analytics/growth
 * @access  Private (SuperAdmin)
 */
const getGrowthAnalytics = async (req, res, next) => {
  try {
    // Last 12 months salon growth
    const monthlyGrowth = await Salon.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    // Last 12 months user growth
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Last 12 months revenue
    const revenueGrowth = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        salonGrowth: monthlyGrowth,
        userGrowth,
        revenueGrowth
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllSalons,
  updateSalonStatus,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  deleteUser,
  getGrowthAnalytics
};

