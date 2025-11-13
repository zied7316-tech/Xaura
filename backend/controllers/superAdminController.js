const User = require('../models/User');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
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
      .sort({ createdAt: -1 });

    // Get stats for each salon
    const salonsWithStats = await Promise.all(
      salons.map(async (salon) => {
        const workerCount = await User.countDocuments({ salonId: salon._id, role: 'Worker' });
        const appointmentCount = await Appointment.countDocuments({ salonId: salon._id });
        const completedCount = await Appointment.countDocuments({ salonId: salon._id, status: 'Completed' });
        
        const revenueData = await Payment.aggregate([
          { $match: { salonId: salon._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const subscription = await Subscription.findOne({ salonId: salon._id });

        return {
          ...salon.toObject(),
          stats: {
            workers: workerCount,
            appointments: appointmentCount,
            completed: completedCount,
            revenue: revenueData[0]?.total || 0
          },
          subscription
        };
      })
    );

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

    res.json({
      success: true,
      data: {
        user,
        recentAppointments,
        payments,
        stats: {
          totalAppointments: recentAppointments.length,
          totalSpent: user.role === 'Client' ? payments.reduce((sum, p) => sum + p.amount, 0) : 0,
          totalEarned: user.role === 'Worker' ? payments.reduce((sum, p) => sum + (p.workerCommission || 0), 0) : 0
        }
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
 * @desc    Delete user (soft delete)
 * @route   DELETE /api/super-admin/users/:id
 * @access  Private (SuperAdmin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting other SuperAdmins
    if (user.role === 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete Super Admin users'
      });
    }

    // Store original data for logging
    const userName = user.name;
    const userEmail = user.email;
    const userRole = user.role;

    // Soft delete - deactivate instead of removing
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`; // Prevent email conflicts
    await user.save();

    // Log activity
    await createActivityLog(
      req,
      'user_deleted',
      'User',
      user._id,
      userName,
      { email: userEmail, role: userRole }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
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

