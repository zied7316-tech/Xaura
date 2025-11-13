const User = require('../models/User');
const Salon = require('../models/Salon');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all workers for salon
 * @route   GET /api/workers
 * @access  Private (Owner)
 */
const getWorkers = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        count: 0,
        data: { workers: [] }
      });
    }

    const workers = await User.find({
      salonId: salon._id,
      role: 'Worker'
    }).select('-password');

    res.json({
      success: true,
      count: workers.length,
      data: { workers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker details with performance
 * @route   GET /api/workers/:id
 * @access  Private (Owner)
 */
const getWorkerDetails = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id).select('-password');
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Verify worker belongs to owner's salon
    const salon = await Salon.findOne({
      _id: worker.salonId,
      ownerId: req.user.id
    });

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this worker'
      });
    }

    // Get worker's appointments
    const appointments = await Appointment.find({
      workerId: worker._id
    }).sort({ dateTime: -1 }).limit(10);

    // Get worker's earnings
    const payments = await Payment.find({
      workerId: worker._id,
      status: 'completed'
    });

    const totalEarnings = payments.reduce((sum, p) => sum + p.workerCommission.amount, 0);
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Get commissions
    const commissions = await Commission.find({
      workerId: worker._id
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        worker,
        stats: {
          totalAppointments: appointments.length,
          completedAppointments: appointments.filter(a => a.status === 'completed').length,
          totalEarnings,
          totalRevenue,
          averageEarningPerAppointment: appointments.length > 0 ? totalEarnings / appointments.length : 0
        },
        recentAppointments: appointments,
        recentCommissions: commissions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker settings (payment model, status)
 * @route   PUT /api/workers/:id
 * @access  Private (Owner)
 */
const updateWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Verify worker belongs to owner's salon
    const salon = await Salon.findOne({
      _id: worker.salonId,
      ownerId: req.user.id
    });

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this worker'
      });
    }

    // Update worker (can update payment model, isActive, etc.)
    const updatedWorker = await User.findByIdAndUpdate(
      req.params.id,
      {
        paymentModel: req.body.paymentModel || worker.paymentModel,
        isActive: req.body.isActive !== undefined ? req.body.isActive : worker.isActive,
        name: req.body.name || worker.name,
        phone: req.body.phone || worker.phone
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Worker updated successfully',
      data: { worker: updatedWorker }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove worker from salon (deactivate)
 * @route   DELETE /api/workers/:id
 * @access  Private (Owner)
 */
const removeWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Verify worker belongs to owner's salon
    const salon = await Salon.findOne({
      _id: worker.salonId,
      ownerId: req.user.id
    });

    if (!salon) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this worker'
      });
    }

    // Check if worker has pending appointments
    const pendingAppointments = await Appointment.countDocuments({
      workerId: worker._id,
      status: { $in: ['pending', 'confirmed'] },
      dateTime: { $gte: new Date() }
    });

    if (pendingAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove worker. They have ${pendingAppointments} pending appointments. Please reassign or cancel them first.`
      });
    }

    // Deactivate worker instead of deleting
    worker.isActive = false;
    worker.salonId = null; // Unlink from salon
    await worker.save();

    res.json({
      success: true,
      message: 'Worker removed from salon successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker performance summary
 * @route   GET /api/workers/:id/performance
 * @access  Private (Owner)
 */
const getWorkerPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    const filter = { workerId: worker._id };
    const dateFilter = {};
    
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    if (Object.keys(dateFilter).length > 0) {
      filter.dateTime = dateFilter;
    }

    // Get appointments
    const appointments = await Appointment.find(filter);
    
    // Get payments (for commission calculation)
    const paymentFilter = { workerId: worker._id, status: 'completed' };
    if (Object.keys(dateFilter).length > 0) {
      paymentFilter.paidAt = dateFilter;
    }
    
    const payments = await Payment.find(paymentFilter);

    // Calculate stats
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommissions = payments.reduce((sum, p) => sum + p.workerCommission.amount, 0);
    const completionRate = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;

    res.json({
      success: true,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          email: worker.email,
          paymentModel: worker.paymentModel
        },
        performance: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          completionRate: completionRate.toFixed(2),
          totalRevenue,
          totalCommissions,
          averageRevenuePerAppointment: totalAppointments > 0 ? totalRevenue / totalAppointments : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workers' performance comparison
 * @route   GET /api/workers/performance/compare
 * @access  Private (Owner)
 */
const compareWorkerPerformance = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        data: { comparison: [] }
      });
    }

    const workers = await User.find({
      salonId: salon._id,
      role: 'Worker',
      isActive: true
    });

    const comparison = await Promise.all(
      workers.map(async (worker) => {
        const appointments = await Appointment.countDocuments({
          workerId: worker._id,
          status: 'completed'
        });

        const payments = await Payment.find({
          workerId: worker._id,
          status: 'completed'
        });

        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalCommissions = payments.reduce((sum, p) => sum + p.workerCommission.amount, 0);

        return {
          workerId: worker._id,
          workerName: worker.name,
          paymentModel: worker.paymentModel.type,
          totalAppointments: appointments,
          totalRevenue,
          totalCommissions,
          averagePerAppointment: appointments > 0 ? totalRevenue / appointments : 0
        };
      })
    );

    // Sort by revenue
    comparison.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: { comparison }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkers,
  getWorkerDetails,
  updateWorker,
  removeWorker,
  getWorkerPerformance,
  compareWorkerPerformance
};

