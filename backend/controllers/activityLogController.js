const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { Parser } = require('json2csv');

/**
 * @desc    Get all activity logs with filtering and pagination
 * @route   GET /api/super-admin/activity-logs
 * @access  Private/SuperAdmin
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      targetType,
      adminId,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build query
    const query = {};

    if (action) {
      query.action = action;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (adminId) {
      query.admin = adminId;
    }

    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search in targetName or details
    if (search) {
      query.$or = [
        { targetName: { $regex: search, $options: 'i' } },
        { 'details.description': { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message,
    });
  }
};

/**
 * @desc    Get activity log statistics
 * @route   GET /api/super-admin/activity-logs/stats
 * @access  Private/SuperAdmin
 */
exports.getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get various statistics
    const [
      totalLogs,
      actionBreakdown,
      recentActivity,
      topAdmins,
      statusBreakdown,
    ] = await Promise.all([
      // Total logs count
      ActivityLog.countDocuments(dateFilter),

      // Actions breakdown
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Recent activity (last 24 hours)
      ActivityLog.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .populate('admin', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Most active admins
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$admin', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'admin',
          },
        },
        { $unwind: '$admin' },
        {
          $project: {
            _id: 0,
            adminId: '$_id',
            name: '$admin.name',
            email: '$admin.email',
            count: 1,
          },
        },
      ]),

      // Status breakdown
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Activity by day (last 7 days)
    const activityByDay = await ActivityLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        total: totalLogs,
        actionBreakdown,
        recentActivity,
        topAdmins,
        statusBreakdown,
        activityByDay,
      },
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single activity log
 * @route   GET /api/super-admin/activity-logs/:id
 * @access  Private/SuperAdmin
 */
exports.getActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findById(req.params.id)
      .populate('admin', 'name email role')
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error.message,
    });
  }
};

/**
 * @desc    Export activity logs to CSV
 * @route   GET /api/super-admin/activity-logs/export
 * @access  Private/SuperAdmin
 */
exports.exportActivityLogs = async (req, res) => {
  try {
    const {
      action,
      targetType,
      adminId,
      status,
      startDate,
      endDate,
    } = req.query;

    // Build query (same as getActivityLogs)
    const query = {};

    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (adminId) query.admin = adminId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get all logs matching query (limit to 10000 for safety)
    const logs = await ActivityLog.find(query)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    // Format data for CSV
    const csvData = logs.map((log) => ({
      Date: new Date(log.createdAt).toLocaleString(),
      Admin: log.admin?.name || 'Unknown',
      Email: log.admin?.email || 'N/A',
      Action: log.action,
      Target: log.targetType || 'N/A',
      'Target Name': log.targetName || 'N/A',
      Status: log.status,
      'IP Address': log.ipAddress || 'N/A',
      Details: log.details ? JSON.stringify(log.details) : '',
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=activity-logs-${Date.now()}.csv`
    );

    res.send(csv);
  } catch (error) {
    console.error('Error exporting activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export activity logs',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete activity log (soft delete or permanent)
 * @route   DELETE /api/super-admin/activity-logs/:id
 * @access  Private/SuperAdmin
 */
exports.deleteActivityLog = async (req, res) => {
  try {
    const log = await ActivityLog.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found',
      });
    }

    res.json({
      success: true,
      message: 'Activity log deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity log',
      error: error.message,
    });
  }
};

/**
 * @desc    Clear old logs (older than specified days)
 * @route   DELETE /api/super-admin/activity-logs/clear-old
 * @access  Private/SuperAdmin
 */
exports.clearOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear old logs',
      error: error.message,
    });
  }
};


