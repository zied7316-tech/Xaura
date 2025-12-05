const WorkerWallet = require('../models/WorkerWallet');
const WorkerInvoice = require('../models/WorkerInvoice');
const WorkerEarning = require('../models/WorkerEarning');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Salon = require('../models/Salon');

/**
 * @desc    Get worker wallet balance
 * @route   GET /api/worker-finance/wallet
 * @access  Private (Worker)
 */
const getWorkerWallet = async (req, res, next) => {
  try {
    let wallet = await WorkerWallet.findOne({ workerId: req.user.id });
    
    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId: req.user.id,
        salonId: req.user.salonId,
        balance: 0,
        totalEarned: 0,
        totalPaid: 0
      });
    }

    // Get total paid out THIS MONTH only
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthInvoices = await WorkerInvoice.find({
      workerId: req.user.id,
      status: 'paid',
      paidDate: { $gte: startOfMonth }
    });
    
    const thisMonthPaidOut = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.json({
      success: true,
      data: {
        ...wallet.toObject(),
        thisMonthPaidOut
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker unpaid earnings (where client didn't pay yet)
 * @route   GET /api/worker-finance/unpaid-earnings
 * @access  Private (Worker)
 */
const getUnpaidEarnings = async (req, res, next) => {
  try {
    // Get earnings where service is completed but client hasn't paid
    const earnings = await WorkerEarning.find({
      workerId: req.user.id,
      isPaid: false  // Client hasn't paid yet
    })
    .populate({
      path: 'appointmentId',
      select: 'dateTime status paymentStatus clientId',
      populate: {
        path: 'clientId',
        select: 'name email phone avatar'
      }
    })
    .populate('serviceId', 'name')
    .sort({ serviceDate: -1 });

    const totalUnpaid = earnings.reduce((sum, earning) => sum + earning.workerEarning, 0);

    res.json({
      success: true,
      data: {
        earnings,
        totalUnpaid,
        count: earnings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker payment history (invoices)
 * @route   GET /api/worker-finance/payment-history
 * @access  Private (Worker)
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const filter = { workerId: req.user.id };
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const invoices = await WorkerInvoice.find(filter)
      .populate('generatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all workers' wallets (Owner only)
 * @route   GET /api/worker-finance/all-wallets
 * @access  Private (Owner)
 */
const getAllWorkersWallets = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const wallets = await WorkerWallet.find({ salonId: salon._id })
      .populate('workerId', 'name email avatar paymentModel');

    res.json({
      success: true,
      data: wallets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker unpaid earnings by worker ID (Owner only)
 * @route   GET /api/worker-finance/unpaid-earnings/:workerId
 * @access  Private (Owner)
 */
const getWorkerUnpaidEarnings = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    
    // Verify owner owns the salon
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const earnings = await WorkerEarning.find({
      workerId,
      salonId: salon._id,
      isPaid: false
    })
    .populate('appointmentId', 'startTime status')
    .populate('serviceId', 'name')
    .sort({ serviceDate: -1 });

    const totalUnpaid = earnings.reduce((sum, earning) => sum + earning.workerEarning, 0);

    res.json({
      success: true,
      data: {
        earnings,
        totalUnpaid,
        count: earnings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate invoice and process payout (Owner only)
 * @route   POST /api/worker-finance/generate-invoice
 * @access  Private (Owner)
 */
const generateInvoice = async (req, res, next) => {
  try {
    const { workerId, periodStart, periodEnd, paymentMethod, notes } = req.body;

    // SECURITY: Explicitly verify user is Owner (defense in depth)
    if (req.user.role !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can generate invoices for workers'
      });
    }

    // Verify owner owns a salon
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // SECURITY: Prevent workers from generating invoices for themselves
    if (workerId && workerId.toString() === req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Workers cannot generate invoices for themselves. Only salon owners can generate invoices.'
      });
    }

    // Get PAID earnings (where client already paid) that haven't been invoiced yet
    // Note: isPaid: true means client paid, but invoiceId is null (not yet invoiced)
    const filter = {
      workerId,
      salonId: salon._id,
      isPaid: true,  // CHANGED: Only earnings where client already paid
      invoiceId: null  // Not yet invoiced
    };

    if (periodStart) {
      filter.serviceDate = { $gte: new Date(periodStart) };
    }
    if (periodEnd) {
      if (!filter.serviceDate) filter.serviceDate = {};
      filter.serviceDate.$lte = new Date(periodEnd);
    }

    const earnings = await WorkerEarning.find(filter)
      .populate('appointmentId', 'dateTime')
      .populate('serviceId', 'name');

    if (earnings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No paid earnings available to invoice for this period. Worker must collect payments from clients first.'
      });
    }

    // Calculate total
    const totalAmount = earnings.reduce((sum, e) => sum + e.workerEarning, 0);

    // Generate invoice number
    const invoiceNumber = await WorkerInvoice.generateInvoiceNumber();

    // Create invoice
    const invoice = await WorkerInvoice.create({
      invoiceNumber,
      workerId,
      salonId: salon._id,
      periodStart: periodStart || earnings[earnings.length - 1].serviceDate,
      periodEnd: periodEnd || earnings[0].serviceDate,
      totalAmount,
      appointmentsCount: earnings.length,
      breakdown: earnings.map(e => ({
        appointmentId: e.appointmentId,
        serviceName: e.serviceId?.name || 'Service',
        servicePrice: e.servicePrice,
        workerEarning: e.workerEarning,
        commissionPercentage: e.commissionPercentage,
        date: e.serviceDate
      })),
      status: 'paid',
      paidDate: new Date(),
      paymentMethod: paymentMethod || 'cash',
      notes: notes || '',
      generatedBy: req.user.id
    });

    // Mark earnings as invoiced (link to invoice)
    await WorkerEarning.updateMany(
      { _id: { $in: earnings.map(e => e._id) } },
      { 
        invoiceId: invoice._id
      }
    );

    // Update wallet
    let wallet = await WorkerWallet.findOne({ workerId });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId,
        salonId: salon._id,
        balance: 0,
        totalEarned: totalAmount,
        totalPaid: totalAmount
      });
    } else {
      wallet.balance = Math.max(0, wallet.balance - totalAmount);
      wallet.totalPaid += totalAmount;
      wallet.lastPayoutDate = new Date();
      await wallet.save();
    }

    // Populate the invoice before sending
    const populatedInvoice = await WorkerInvoice.findById(invoice._id)
      .populate('workerId', 'name email')
      .populate('generatedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Invoice generated and payment processed successfully',
      data: populatedInvoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record worker earning from appointment
 * @route   POST /api/worker-finance/record-earning
 * @access  Private (Owner/System)
 */
const recordEarning = async (req, res, next) => {
  try {
    const { workerId, appointmentId, serviceId, servicePrice } = req.body;

    // Get worker payment model
    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Calculate earning based on payment model
    let workerEarning = 0;
    let commissionPercentage = 0;

    if (worker.paymentModel.type === 'percentage_commission') {
      commissionPercentage = worker.paymentModel.commissionPercentage || 50;
      workerEarning = (servicePrice * commissionPercentage) / 100;
    } else if (worker.paymentModel.type === 'hybrid') {
      commissionPercentage = worker.paymentModel.commissionPercentage || 30;
      workerEarning = (servicePrice * commissionPercentage) / 100;
      // Note: Base salary is handled separately in monthly payroll
    }
    // For fixed_salary, earnings are calculated monthly, not per appointment

    if (workerEarning > 0) {
      // Create earning record
      const earning = await WorkerEarning.create({
        workerId,
        salonId: worker.salonId,
        appointmentId,
        serviceId,
        servicePrice,
        commissionPercentage,
        workerEarning,
        paymentModelType: worker.paymentModel.type,
        isPaid: false,
        serviceDate: new Date()
      });

      // Update wallet balance
      let wallet = await WorkerWallet.findOne({ workerId });
      if (!wallet) {
        wallet = await WorkerWallet.create({
          workerId,
          salonId: worker.salonId,
          balance: workerEarning,
          totalEarned: workerEarning
        });
      } else {
        wallet.balance += workerEarning;
        wallet.totalEarned += workerEarning;
        await wallet.save();
      }

      res.status(201).json({
        success: true,
        message: 'Earning recorded successfully',
        data: earning
      });
    } else {
      res.json({
        success: true,
        message: 'No commission earning for this payment model',
        data: null
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker financial summary
 * @route   GET /api/worker-finance/summary/:workerId
 * @access  Private (Owner)
 */
const getWorkerFinancialSummary = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    
    // Verify owner
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get wallet
    const wallet = await WorkerWallet.findOne({ workerId });

    // Get unpaid earnings
    const unpaidEarnings = await WorkerEarning.find({
      workerId,
      isPaid: false
    });

    // Get recent invoices
    const recentInvoices = await WorkerInvoice.find({
      workerId,
      status: 'paid'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyEarnings = await WorkerEarning.find({
      workerId,
      serviceDate: { $gte: startOfMonth }
    });

    const summary = {
      wallet: wallet || { balance: 0, totalEarned: 0, totalPaid: 0 },
      unpaidCount: unpaidEarnings.length,
      unpaidTotal: unpaidEarnings.reduce((sum, e) => sum + e.workerEarning, 0),
      monthlyEarnings: monthlyEarnings.reduce((sum, e) => sum + e.workerEarning, 0),
      monthlyAppointments: monthlyEarnings.length,
      recentInvoices
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get paid earnings (where client already paid)
 * @route   GET /api/worker-finance/paid-earnings
 * @access  Private (Worker)
 */
const getPaidEarnings = async (req, res, next) => {
  try {
    // Get earnings where client has paid
    const earnings = await WorkerEarning.find({
      workerId: req.user.id,
      isPaid: true  // Client has paid
    })
    .populate({
      path: 'appointmentId',
      select: 'dateTime status paymentStatus clientId paymentMethod',
      populate: {
        path: 'clientId',
        select: 'name email phone avatar'
      }
    })
    .populate('serviceId', 'name')
    .sort({ serviceDate: -1 });

    const totalPaid = earnings.reduce((sum, earning) => sum + earning.workerEarning, 0);

    res.json({
      success: true,
      data: {
        earnings,
        totalPaid,
        count: earnings.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark unpaid earning as paid (when client pays later)
 * @route   PUT /api/worker-finance/mark-paid/:earningId
 * @access  Private (Worker)
 */
const markEarningAsPaid = async (req, res, next) => {
  try {
    const { earningId } = req.params;
    const { paymentMethod } = req.body;

    const earning = await WorkerEarning.findById(earningId);

    if (!earning) {
      return res.status(404).json({
        success: false,
        message: 'Earning not found'
      });
    }

    // Verify it belongs to this worker
    if (earning.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (earning.isPaid) {
      return res.status(400).json({
        success: false,
        message: 'This earning is already marked as paid'
      });
    }

    // Mark as paid and update wallet
    earning.isPaid = true;
    await earning.save();

    // Update worker wallet
    let wallet = await WorkerWallet.findOne({ workerId: req.user.id });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId: req.user.id,
        salonId: earning.salonId,
        balance: earning.workerEarning,
        totalEarned: earning.workerEarning,
        totalPaid: 0
      });
    } else {
      wallet.balance += earning.workerEarning;
      wallet.totalEarned += earning.workerEarning;
      await wallet.save();
    }

    // Update appointment payment status
    if (earning.appointmentId) {
      await Appointment.findByIdAndUpdate(earning.appointmentId, {
        paymentStatus: 'paid',
        paymentMethod: paymentMethod || 'cash',
        paidAmount: earning.servicePrice,
        paidAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: earning
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get estimated earnings from upcoming confirmed appointments
 * @route   GET /api/worker-finance/estimated-earnings
 * @access  Private (Worker)
 */
const getEstimatedEarnings = async (req, res, next) => {
  try {
    const worker = await User.findById(req.user.id);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get all confirmed/in-progress appointments in the future
    const now = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const appointments = await Appointment.find({
      workerId: req.user.id,
      status: { $in: ['Confirmed', 'In Progress'] },
      dateTime: { $gte: now, $lte: endOfWeek }
    })
    .populate('clientId', 'name email phone avatar')
    .populate('serviceId', 'name price')
    .sort({ dateTime: 1 });

    // Calculate estimated earnings
    let commissionPercentage = 50; // Default
    if (worker.paymentModel && worker.paymentModel.type) {
      if (worker.paymentModel.type === 'percentage_commission') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 50;
      } else if (worker.paymentModel.type === 'hybrid') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 30;
      }
    }

    const estimatedBreakdown = appointments.map(apt => {
      const servicePrice = apt.serviceId?.price || apt.servicePriceAtBooking;
      const estimatedEarning = (servicePrice * commissionPercentage) / 100;
      
      return {
        appointmentId: apt._id,
        clientName: apt.clientId?.name,
        clientPhone: apt.clientId?.phone,
        clientAvatar: apt.clientId?.avatar,
        serviceName: apt.serviceId?.name,
        servicePrice,
        estimatedEarning,
        appointmentDate: apt.dateTime
      };
    });

    const totalEstimated = estimatedBreakdown.reduce((sum, item) => sum + item.estimatedEarning, 0);

    res.json({
      success: true,
      data: {
        thisWeekEstimated: totalEstimated,
        appointmentsCount: appointments.length,
        breakdown: estimatedBreakdown,
        commissionPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkerWallet,
  getUnpaidEarnings,
  getPaidEarnings,
  markEarningAsPaid,
  getPaymentHistory,
  getAllWorkersWallets,
  getWorkerUnpaidEarnings,
  generateInvoice,
  recordEarning,
  getWorkerFinancialSummary,
  getEstimatedEarnings
};

