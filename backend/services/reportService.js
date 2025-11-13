const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Subscription = require('../models/Subscription');
const BillingHistory = require('../models/BillingHistory');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const fs = require('fs');
const path = require('path');

/**
 * Generate Platform Overview Report
 */
const generatePlatformReport = async (format = 'pdf', dateRange = {}) => {
  try {
    // Fetch data
    const [
      totalSalons,
      totalUsers,
      totalRevenue,
      activeSubs,
      recentGrowth,
    ] = await Promise.all([
      Salon.countDocuments({ isActive: true }),
      User.countDocuments(),
      BillingHistory.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Subscription.countDocuments({ status: { $in: ['active', 'trial'] } }),
      Salon.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    const data = {
      title: 'Platform Overview Report',
      generatedAt: new Date(),
      stats: {
        totalSalons,
        totalUsers,
        totalRevenue: totalRevenue[0]?.total || 0,
        activeSubscriptions: activeSubs,
      },
      growth: recentGrowth,
    };

    if (format === 'pdf') {
      return await generatePDF(data);
    } else {
      return await generateExcel(data);
    }
  } catch (error) {
    console.error('Error generating platform report:', error);
    throw error;
  }
};

/**
 * Generate Financial Report
 */
const generateFinancialReport = async (format = 'pdf', startDate, endDate) => {
  try {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.createdAt = dateFilter;
    }

    const [revenueStats, revenueByPlan, topSalons] = await Promise.all([
      BillingHistory.aggregate([
        { $match: { status: 'succeeded', ...matchFilter } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            avgTransaction: { $avg: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      BillingHistory.aggregate([
        { $match: { status: 'succeeded', ...matchFilter } },
        {
          $lookup: {
            from: 'subscriptions',
            localField: 'subscription',
            foreignField: '_id',
            as: 'sub',
          },
        },
        { $unwind: '$sub' },
        {
          $group: {
            _id: '$sub.plan',
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      BillingHistory.aggregate([
        { $match: { status: 'succeeded', ...matchFilter } },
        {
          $group: {
            _id: '$salon',
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'salons',
            localField: '_id',
            foreignField: '_id',
            as: 'salon',
          },
        },
        { $unwind: '$salon' },
      ]),
    ]);

    const data = {
      title: 'Financial Report',
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      summary: revenueStats[0] || {
        totalRevenue: 0,
        avgTransaction: 0,
        count: 0,
      },
      revenueByPlan,
      topSalons,
    };

    if (format === 'pdf') {
      return await generateFinancialPDF(data);
    } else {
      return await generateFinancialExcel(data);
    }
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
};

/**
 * Generate Salon Performance Report
 */
const generateSalonReport = async (format = 'pdf', salonId = null) => {
  try {
    const query = salonId ? { _id: salonId } : {};
    
    const salons = await Salon.find(query).limit(50).lean();
    
    const salonData = await Promise.all(
      salons.map(async (salon) => {
        const [appointments, revenue, activeWorkers] = await Promise.all([
          Appointment.countDocuments({ salonId: salon._id }),
          Payment.aggregate([
            { $match: { salonId: salon._id, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]),
          User.countDocuments({
            salonId: salon._id,
            role: 'Worker',
            isActive: true,
          }),
        ]);

        return {
          name: salon.name,
          email: salon.email,
          appointments,
          revenue: revenue[0]?.total || 0,
          activeWorkers,
          createdAt: salon.createdAt,
        };
      })
    );

    const data = {
      title: 'Salon Performance Report',
      generatedAt: new Date(),
      salons: salonData,
    };

    if (format === 'pdf') {
      return await generateSalonPDF(data);
    } else {
      return await generateSalonExcel(data);
    }
  } catch (error) {
    console.error('Error generating salon report:', error);
    throw error;
  }
};

/**
 * Generate User Analytics Report
 */
const generateUserReport = async (format = 'pdf') => {
  try {
    const [usersByRole, userGrowth, topUsers] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
      User.find({ role: 'Client' })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email createdAt')
        .lean(),
    ]);

    const data = {
      title: 'User Analytics Report',
      generatedAt: new Date(),
      usersByRole,
      userGrowth,
      recentUsers: topUsers,
    };

    if (format === 'pdf') {
      return await generateUserPDF(data);
    } else {
      return await generateUserExcel(data);
    }
  } catch (error) {
    console.error('Error generating user report:', error);
    throw error;
  }
};

/**
 * Generate PDF Report
 */
const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Xaura Platform', { align: 'center' })
        .moveDown();

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(data.title, { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${data.generatedAt.toLocaleString()}`, {
          align: 'center',
        })
        .moveDown(2);

      // Stats section
      doc.fontSize(14).font('Helvetica-Bold').text('Key Metrics').moveDown();

      doc.fontSize(12).font('Helvetica');
      doc.text(`Total Salons: ${data.stats.totalSalons}`);
      doc.text(`Total Users: ${data.stats.totalUsers}`);
      doc.text(`Total Revenue: $${data.stats.totalRevenue.toFixed(2)}`);
      doc.text(`Active Subscriptions: ${data.stats.activeSubscriptions}`);
      doc.moveDown(2);

      // Growth section
      if (data.growth && data.growth.length > 0) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Growth Trend (Last 12 Months)')
          .moveDown();

        doc.fontSize(10).font('Helvetica');
        data.growth.forEach((item) => {
          doc.text(`${item._id}: ${item.count} new salons`);
        });
      }

      // Footer
      doc
        .moveDown(4)
        .fontSize(8)
        .text('Xaura - Beauty Platform Management System', {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Financial PDF
 */
const generateFinancialPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Financial Report', { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Generated: ${data.generatedAt.toLocaleString()}`, {
          align: 'center',
        });

      if (data.dateRange.startDate || data.dateRange.endDate) {
        doc.text(
          `Period: ${data.dateRange.startDate || 'Start'} to ${data.dateRange.endDate || 'Now'}`,
          { align: 'center' }
        );
      }
      doc.moveDown(2);

      // Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Revenue Summary').moveDown();

      doc.fontSize(12).font('Helvetica');
      doc.text(
        `Total Revenue: $${data.summary.totalRevenue.toFixed(2)}`
      );
      doc.text(`Total Transactions: ${data.summary.count}`);
      doc.text(`Average Transaction: $${data.summary.avgTransaction.toFixed(2)}`);
      doc.moveDown(2);

      // Revenue by Plan
      if (data.revenueByPlan.length > 0) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Revenue by Plan')
          .moveDown();

        doc.fontSize(10).font('Helvetica');
        data.revenueByPlan.forEach((plan) => {
          doc.text(
            `${plan._id}: $${plan.revenue.toFixed(2)} (${plan.count} transactions)`
          );
        });
        doc.moveDown(2);
      }

      // Top Salons
      if (data.topSalons.length > 0) {
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Top 10 Revenue Generating Salons')
          .moveDown();

        doc.fontSize(10).font('Helvetica');
        data.topSalons.forEach((item, index) => {
          doc.text(
            `${index + 1}. ${item.salon.name}: $${item.revenue.toFixed(2)}`
          );
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Salon Performance PDF
 */
const generateSalonPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Salon Performance Report', { align: 'center' })
        .moveDown(2);

      // Salons
      data.salons.forEach((salon, index) => {
        if (index > 0) doc.addPage();

        doc.fontSize(16).font('Helvetica-Bold').text(salon.name).moveDown();

        doc.fontSize(10).font('Helvetica');
        doc.text(`Email: ${salon.email}`);
        doc.text(`Total Appointments: ${salon.appointments}`);
        doc.text(`Total Revenue: $${salon.revenue.toFixed(2)}`);
        doc.text(`Active Workers: ${salon.activeWorkers}`);
        doc.text(
          `Joined: ${new Date(salon.createdAt).toLocaleDateString()}`
        );
        doc.moveDown(2);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate User Analytics PDF
 */
const generateUserPDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('User Analytics Report', { align: 'center' })
        .moveDown(2);

      // Users by Role
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Users by Role')
        .moveDown();

      doc.fontSize(10).font('Helvetica');
      data.usersByRole.forEach((item) => {
        doc.text(`${item._id}: ${item.count} users`);
      });
      doc.moveDown(2);

      // Recent Users
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Recent User Signups')
        .moveDown();

      doc.fontSize(10).font('Helvetica');
      data.recentUsers.forEach((user) => {
        doc.text(
          `${user.name} (${user.email}) - ${new Date(user.createdAt).toLocaleDateString()}`
        );
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate Excel Report
 */
const generateExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Platform Overview');

  // Title
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'Xaura Platform Overview Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Generated date
  worksheet.mergeCells('A2:D2');
  worksheet.getCell('A2').value = `Generated: ${data.generatedAt.toLocaleString()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  // Stats
  worksheet.addRow([]);
  worksheet.addRow(['Metric', 'Value']);
  worksheet.addRow(['Total Salons', data.stats.totalSalons]);
  worksheet.addRow(['Total Users', data.stats.totalUsers]);
  worksheet.addRow(['Total Revenue', `$${data.stats.totalRevenue.toFixed(2)}`]);
  worksheet.addRow(['Active Subscriptions', data.stats.activeSubscriptions]);

  // Growth
  if (data.growth && data.growth.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['Month', 'New Salons']);
    data.growth.forEach((item) => {
      worksheet.addRow([item._id, item.count]);
    });
  }

  // Style the header row
  worksheet.getRow(4).font = { bold: true };
  worksheet.columns = [{ width: 30 }, { width: 20 }];

  return workbook.xlsx.writeBuffer();
};

/**
 * Generate Financial Excel
 */
const generateFinancialExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Financial Report');

  // Title
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'Financial Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Summary
  worksheet.addRow([]);
  worksheet.addRow(['Revenue Summary']);
  worksheet.addRow(['Total Revenue', `$${data.summary.totalRevenue.toFixed(2)}`]);
  worksheet.addRow(['Total Transactions', data.summary.count]);
  worksheet.addRow([
    'Average Transaction',
    `$${data.summary.avgTransaction.toFixed(2)}`,
  ]);

  // Revenue by Plan
  worksheet.addRow([]);
  worksheet.addRow(['Plan', 'Revenue', 'Transactions']);
  data.revenueByPlan.forEach((plan) => {
    worksheet.addRow([plan._id, plan.revenue, plan.count]);
  });

  // Top Salons
  if (data.topSalons.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['Top Salons', 'Revenue']);
    data.topSalons.forEach((item) => {
      worksheet.addRow([item.salon.name, item.revenue]);
    });
  }

  worksheet.columns = [{ width: 30 }, { width: 20 }, { width: 20 }];

  return workbook.xlsx.writeBuffer();
};

/**
 * Generate Salon Excel
 */
const generateSalonExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Salon Performance');

  // Headers
  worksheet.addRow([
    'Salon Name',
    'Email',
    'Appointments',
    'Revenue',
    'Active Workers',
    'Joined Date',
  ]);
  worksheet.getRow(1).font = { bold: true };

  // Data
  data.salons.forEach((salon) => {
    worksheet.addRow([
      salon.name,
      salon.email,
      salon.appointments,
      salon.revenue,
      salon.activeWorkers,
      new Date(salon.createdAt).toLocaleDateString(),
    ]);
  });

  worksheet.columns = [
    { width: 30 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
  ];

  return workbook.xlsx.writeBuffer();
};

/**
 * Generate User Excel
 */
const generateUserExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('User Analytics');

  // Users by Role
  worksheet.addRow(['Users by Role']);
  worksheet.addRow(['Role', 'Count']);
  data.usersByRole.forEach((item) => {
    worksheet.addRow([item._id, item.count]);
  });

  // Recent Users
  worksheet.addRow([]);
  worksheet.addRow(['Recent Users']);
  worksheet.addRow(['Name', 'Email', 'Joined']);
  data.recentUsers.forEach((user) => {
    worksheet.addRow([
      user.name,
      user.email,
      new Date(user.createdAt).toLocaleDateString(),
    ]);
  });

  worksheet.columns = [{ width: 30 }, { width: 30 }, { width: 20 }];

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  generatePlatformReport,
  generateFinancialReport,
  generateSalonReport,
  generateUserReport,
};


