const User = require('../models/User');
const WorkerStatusLog = require('../models/WorkerStatusLog');

/**
 * @desc    Get worker's current status
 * @route   GET /api/worker-status/my-status
 * @access  Private (Worker)
 */
const getMyStatus = async (req, res, next) => {
  try {
    const worker = await User.findById(req.user.id).select('currentStatus lastStatusChange');

    res.json({
      success: true,
      data: {
        currentStatus: worker.currentStatus || 'offline',
        lastStatusChange: worker.lastStatusChange
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker's current status (quick toggle)
 * @route   PUT /api/worker-status/toggle
 * @access  Private (Worker)
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['available', 'on_break', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: available, on_break, or offline'
      });
    }

    // Get current worker data
    const worker = await User.findById(req.user.id);
    const previousStatus = worker.currentStatus || 'offline';
    const previousStatusChangeTime = worker.lastStatusChange || new Date();
    
    // Calculate duration in previous status (in minutes)
    const now = new Date();
    const durationInMinutes = Math.floor((now - new Date(previousStatusChangeTime)) / 60000);

    // Log the status change
    await WorkerStatusLog.create({
      workerId: req.user.id,
      salonId: worker.salonId,
      previousStatus,
      newStatus: status,
      changedAt: now,
      durationInPreviousStatus: durationInMinutes,
      date: new Date(now.toDateString()) // Store date for daily queries
    });

    // Update worker status
    worker.currentStatus = status;
    worker.lastStatusChange = now;
    await worker.save();

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: {
        currentStatus: worker.currentStatus,
        lastStatusChange: worker.lastStatusChange
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workers status for a salon (Owner view)
 * @route   GET /api/worker-status/salon/:salonId
 * @access  Private (Owner)
 */
const getSalonWorkersStatus = async (req, res, next) => {
  try {
    const { salonId } = req.params;

    const workers = await User.find({
      salonId,
      role: 'Worker',
      isActive: true
    }).select('name email avatar currentStatus lastStatusChange');

    res.json({
      success: true,
      data: workers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker analytics for owner
 * @route   GET /api/worker-status/analytics/worker/:workerId
 * @access  Private (Owner)
 */
const getWorkerAnalytics = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get worker info
    const worker = await User.findById(workerId).select('name email avatar salonId');
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get status logs for the period
    const logs = await WorkerStatusLog.find({
      workerId,
      changedAt: { $gte: start, $lte: end }
    }).sort({ changedAt: 1 });

    // Calculate daily statistics
    const dailyStats = {};
    
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          totalWorkingMinutes: 0,
          totalBreakMinutes: 0,
          totalOfflineMinutes: 0,
          statusChanges: 0,
          firstAvailable: null,
          lastOffline: null
        };
      }

      const stat = dailyStats[dateKey];
      stat.statusChanges++;

      // Track time in each status
      if (log.previousStatus === 'available') {
        stat.totalWorkingMinutes += log.durationInPreviousStatus;
      } else if (log.previousStatus === 'on_break') {
        stat.totalBreakMinutes += log.durationInPreviousStatus;
      } else if (log.previousStatus === 'offline') {
        stat.totalOfflineMinutes += log.durationInPreviousStatus;
      }

      // Track first available and last offline times
      if (log.newStatus === 'available' && !stat.firstAvailable) {
        stat.firstAvailable = log.changedAt;
      }
      if (log.newStatus === 'offline') {
        stat.lastOffline = log.changedAt;
      }
    });

    // Calculate totals
    const totalStats = {
      totalWorkingHours: 0,
      totalBreakHours: 0,
      totalDaysWorked: 0,
      averageWorkingHoursPerDay: 0,
      averageBreakTime: 0
    };

    Object.values(dailyStats).forEach(day => {
      totalStats.totalWorkingHours += day.totalWorkingMinutes / 60;
      totalStats.totalBreakHours += day.totalBreakMinutes / 60;
      if (day.totalWorkingMinutes > 0) {
        totalStats.totalDaysWorked++;
      }
    });

    if (totalStats.totalDaysWorked > 0) {
      totalStats.averageWorkingHoursPerDay = totalStats.totalWorkingHours / totalStats.totalDaysWorked;
      totalStats.averageBreakTime = totalStats.totalBreakHours / totalStats.totalDaysWorked;
    }

    res.json({
      success: true,
      data: {
        worker: {
          id: worker._id,
          name: worker.name,
          email: worker.email,
          avatar: worker.avatar
        },
        period: {
          startDate: start,
          endDate: end
        },
        totalStats,
        dailyStats: Object.values(dailyStats).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon-wide analytics
 * @route   GET /api/worker-status/analytics/salon
 * @access  Private (Owner)
 */
const getSalonAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Get owner's salon
    const Salon = require('../models/Salon');
    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all workers
    const workers = await User.find({
      salonId: salon._id,
      role: 'Worker'
    }).select('name currentStatus');

    // Get logs for all workers
    const logs = await WorkerStatusLog.find({
      salonId: salon._id,
      changedAt: { $gte: start, $lte: end }
    }).populate('workerId', 'name');

    // Calculate per-worker stats
    const workerStats = {};
    
    workers.forEach(worker => {
      workerStats[worker._id] = {
        workerId: worker._id,
        name: worker.name,
        currentStatus: worker.currentStatus,
        totalWorkingMinutes: 0,
        totalBreakMinutes: 0,
        daysWorked: new Set()
      };
    });

    logs.forEach(log => {
      const workerId = log.workerId._id || log.workerId;
      if (workerStats[workerId]) {
        if (log.previousStatus === 'available') {
          workerStats[workerId].totalWorkingMinutes += log.durationInPreviousStatus;
          workerStats[workerId].daysWorked.add(log.date.toISOString().split('T')[0]);
        } else if (log.previousStatus === 'on_break') {
          workerStats[workerId].totalBreakMinutes += log.durationInPreviousStatus;
        }
      }
    });

    // Convert to array and format
    const workersArray = Object.values(workerStats).map(stat => ({
      ...stat,
      totalWorkingHours: (stat.totalWorkingMinutes / 60).toFixed(2),
      totalBreakHours: (stat.totalBreakMinutes / 60).toFixed(2),
      daysWorked: stat.daysWorked.size,
      daysWorked: undefined // Remove Set object
    }));

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        totalWorkers: workers.length,
        workersCurrentlyAvailable: workers.filter(w => w.currentStatus === 'available').length,
        workersOnBreak: workers.filter(w => w.currentStatus === 'on_break').length,
        workersOffline: workers.filter(w => w.currentStatus === 'offline').length,
        workerStats: workersArray
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyStatus,
  toggleStatus,
  getSalonWorkersStatus,
  getWorkerAnalytics,
  getSalonAnalytics
};

