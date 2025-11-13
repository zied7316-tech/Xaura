const reportService = require('../services/reportService');
const { createActivityLog } = require('../middleware/activityLogger');

/**
 * @desc    Generate Platform Overview Report
 * @route   POST /api/super-admin/reports/platform
 * @access  Private/SuperAdmin
 */
exports.generatePlatformReport = async (req, res) => {
  try {
    const { format = 'pdf' } = req.body;

    const buffer = await reportService.generatePlatformReport(format);

    // Log activity
    await createActivityLog(
      req,
      'report_generated',
      'Report',
      null,
      `Platform Overview Report (${format.toUpperCase()})`,
      { format }
    );

    // Set response headers
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=platform-report-${Date.now()}.pdf`
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=platform-report-${Date.now()}.xlsx`
      );
    }

    res.send(buffer);
  } catch (error) {
    console.error('Error generating platform report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate Financial Report
 * @route   POST /api/super-admin/reports/financial
 * @access  Private/SuperAdmin
 */
exports.generateFinancialReport = async (req, res) => {
  try {
    const { format = 'pdf', startDate, endDate } = req.body;

    const buffer = await reportService.generateFinancialReport(
      format,
      startDate,
      endDate
    );

    // Log activity
    await createActivityLog(
      req,
      'report_generated',
      'Report',
      null,
      `Financial Report (${format.toUpperCase()})`,
      { format, startDate, endDate }
    );

    // Set response headers
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=financial-report-${Date.now()}.pdf`
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=financial-report-${Date.now()}.xlsx`
      );
    }

    res.send(buffer);
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate Salon Performance Report
 * @route   POST /api/super-admin/reports/salon
 * @access  Private/SuperAdmin
 */
exports.generateSalonReport = async (req, res) => {
  try {
    const { format = 'pdf', salonId } = req.body;

    const buffer = await reportService.generateSalonReport(format, salonId);

    // Log activity
    await createActivityLog(
      req,
      'report_generated',
      'Report',
      null,
      `Salon Performance Report (${format.toUpperCase()})`,
      { format, salonId }
    );

    // Set response headers
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=salon-report-${Date.now()}.pdf`
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=salon-report-${Date.now()}.xlsx`
      );
    }

    res.send(buffer);
  } catch (error) {
    console.error('Error generating salon report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate User Analytics Report
 * @route   POST /api/super-admin/reports/users
 * @access  Private/SuperAdmin
 */
exports.generateUserReport = async (req, res) => {
  try {
    const { format = 'pdf' } = req.body;

    const buffer = await reportService.generateUserReport(format);

    // Log activity
    await createActivityLog(
      req,
      'report_generated',
      'Report',
      null,
      `User Analytics Report (${format.toUpperCase()})`,
      { format }
    );

    // Set response headers
    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=user-report-${Date.now()}.pdf`
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=user-report-${Date.now()}.xlsx`
      );
    }

    res.send(buffer);
  } catch (error) {
    console.error('Error generating user report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};


