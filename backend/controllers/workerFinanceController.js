const mongoose = require('mongoose');
const WorkerWallet = require('../models/WorkerWallet');
const WorkerInvoice = require('../models/WorkerInvoice');
const WorkerEarning = require('../models/WorkerEarning');
const WorkerAdvance = require('../models/WorkerAdvance');
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

    // Calculate net balance (balance - outstanding advances)
    // This is what worker can actually receive (can be negative if advances exceed balance)
    const netBalance = (wallet.balance || 0) - (wallet.outstandingAdvances || 0);

    res.json({
      success: true,
      data: {
        ...wallet.toObject(),
        thisMonthPaidOut,
        netBalance // Net available balance after advances
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

    // Check if owner works as worker and include their wallet
    const owner = await User.findById(req.user.id).select('worksAsWorker paymentModel');
    if (owner && owner.worksAsWorker) {
      // Check if owner already has a wallet
      const ownerWalletExists = wallets.some(w => {
        const walletWorkerId = w.workerId?._id?.toString() || w.workerId?.toString() || w.workerId;
        return walletWorkerId && walletWorkerId.toString() === req.user.id.toString();
      });

      // If owner doesn't have a wallet yet, create one
      if (!ownerWalletExists) {
        let ownerWallet = await WorkerWallet.findOne({ 
          workerId: req.user.id,
          salonId: salon._id 
        });

        if (!ownerWallet) {
          ownerWallet = await WorkerWallet.create({
            workerId: req.user.id,
            salonId: salon._id,
            balance: 0,
            totalEarned: 0,
            totalPaid: 0
          });
        }

        // Populate the workerId field and add to wallets array
        ownerWallet = await WorkerWallet.findById(ownerWallet._id)
          .populate('workerId', 'name email avatar paymentModel');
        
        wallets.push(ownerWallet);
      }
    }

    // Recalculate outstandingAdvances from WorkerAdvance records for accuracy
    // This ensures the value is always in sync with actual advance records
    const walletsWithNetBalance = await Promise.all(wallets.map(async (wallet) => {
      // Get worker ID - handle both populated and non-populated cases
      // Validate workerId exists and is valid (skip wallets with deleted/orphaned worker references)
      let workerId = null;
      if (wallet.workerId) {
        // Handle populated worker (object with _id) or direct ObjectId
        if (wallet.workerId._id) {
          workerId = wallet.workerId._id;
        } else if (wallet.workerId.toString && typeof wallet.workerId.toString === 'function') {
          // It's a valid ObjectId (has toString method)
          workerId = wallet.workerId;
        } else if (typeof wallet.workerId === 'string' || wallet.workerId instanceof mongoose.Types.ObjectId) {
          // Direct ObjectId or string
          workerId = wallet.workerId;
        }
      }
      
      // Validate workerId is actually a valid ObjectId (not null, undefined, or empty object)
      // If workerId is invalid (worker was deleted), skip advance calculation
      const isValidObjectId = workerId && 
        (mongoose.Types.ObjectId.isValid(workerId) || 
         (typeof workerId === 'object' && workerId.toString && typeof workerId.toString === 'function'));
      
      if (!isValidObjectId) {
        // Worker was deleted or workerId is invalid - use existing wallet values
        const balance = Number(wallet.balance) || 0;
        const outstanding = Number(wallet.outstandingAdvances) || 0;
        const netBalance = balance - outstanding;
        return {
          ...wallet.toObject(),
          outstandingAdvances: outstanding, // Use existing value from wallet
          netBalance // Calculate netBalance with existing outstandingAdvances
        };
      }
      
      // Get actual outstanding advances from WorkerAdvance records
      const outstandingAdvances = await WorkerAdvance.find({
        workerId: workerId,
        salonId: salon._id,
        status: 'approved' // Only approved advances that haven't been deducted
      });
      
      const actualOutstandingAdvances = outstandingAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      
      // Calculate netBalance = balance - outstandingAdvances (what worker can actually receive, can be negative)
      const balance = Number(wallet.balance) || 0;
      const outstanding = Number(actualOutstandingAdvances) || 0;
      const netBalance = balance - outstanding;
      
      return {
        ...wallet.toObject(),
        outstandingAdvances: actualOutstandingAdvances, // Use recalculated value
        netBalance // Add netBalance to match worker view
      };
    }));

    res.json({
      success: true,
      data: walletsWithNetBalance
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
 * @desc    Get worker paid earnings that haven't been invoiced yet (Owner only)
 * @route   GET /api/worker-finance/paid-earnings/:workerId
 * @access  Private (Owner)
 */
const getWorkerPaidEarnings = async (req, res, next) => {
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

    // Get paid earnings that haven't been invoiced yet (can be invoiced)
    const earnings = await WorkerEarning.find({
      workerId,
      salonId: salon._id,
      isPaid: true,  // Client has paid
      invoiceId: null  // Not yet invoiced
    })
    .populate('appointmentId', 'dateTime status paymentStatus')
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
 * @desc    Generate invoice and process payout (Owner only)
 * @route   POST /api/worker-finance/generate-invoice
 * @access  Private (Owner)
 */
const generateInvoice = async (req, res, next) => {
  try {
    const { workerId, periodStart, periodEnd, paymentMethod, notes } = req.body;

    // Debug logging
    console.log('Generate Invoice Request:', {
      workerId,
      periodStart,
      periodEnd,
      paymentMethod,
      hasWorkerId: !!workerId,
      workerIdType: typeof workerId,
      fullBody: req.body
    });

    // Validate required fields
    if (!workerId) {
      console.error('Missing workerId in request body');
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required',
        received: {
          workerId,
          body: req.body
        }
      });
    }

    // Ensure workerId is a string (MongoDB ObjectId)
    const workerIdStr = String(workerId).trim();
    if (!workerIdStr || workerIdStr === 'undefined' || workerIdStr === 'null') {
      console.error('Invalid workerId format:', workerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid worker ID format',
        received: workerId
      });
    }

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

    // Note: Owners can generate invoices for any worker, including themselves if they work as workers.
    // The route middleware already ensures only owners can access this endpoint.

    // Get PAID earnings (where client already paid) that haven't been invoiced yet
    // Note: isPaid: true means client paid, but invoiceId is null (not yet invoiced)
    const filter = {
      workerId: workerIdStr,
      salonId: salon._id,
      isPaid: true,  // CHANGED: Only earnings where client already paid
      invoiceId: null  // Not yet invoiced
    };

    // Only add date filter if dates are provided (null/empty/undefined = Pay All Balance)
    // Handle both null values and string "null" from frontend
    if (periodStart && periodStart !== 'null' && periodStart !== '' && periodStart !== null) {
      try {
        const start = new Date(periodStart);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid period start date format'
          });
        }
        start.setHours(0, 0, 0, 0); // Start of day
        filter.serviceDate = { $gte: start };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid period start date: ' + error.message
        });
      }
    }
    if (periodEnd && periodEnd !== 'null' && periodEnd !== '' && periodEnd !== null) {
      try {
        const end = new Date(periodEnd);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid period end date format'
          });
        }
        end.setHours(23, 59, 59, 999); // End of day - include full day
        if (!filter.serviceDate) filter.serviceDate = {};
        filter.serviceDate.$lte = end;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid period end date: ' + error.message
        });
      }
    }
    // If both are null/empty, get ALL paid earnings (for Pay All Balance feature)

    const earnings = await WorkerEarning.find(filter)
      .populate('appointmentId', 'dateTime')
      .populate('serviceId', 'name');

    if (earnings.length === 0) {
      // Provide more details about why no earnings were found
      const totalPaidEarnings = await WorkerEarning.countDocuments({
        workerId: workerIdStr,
        salonId: salon._id,
        isPaid: true
      });
      const alreadyInvoiced = await WorkerEarning.countDocuments({
        workerId: workerIdStr,
        salonId: salon._id,
        isPaid: true,
        invoiceId: { $ne: null }
      });
      const unpaidEarnings = await WorkerEarning.countDocuments({
        workerId: workerIdStr,
        salonId: salon._id,
        isPaid: false
      });
      const availableToInvoice = await WorkerEarning.countDocuments({
        workerId: workerIdStr,
        salonId: salon._id,
        isPaid: true,
        invoiceId: null
      });

      console.log('Earnings breakdown:', {
        totalPaidEarnings,
        alreadyInvoiced,
        unpaidEarnings,
        availableToInvoice
      });

      // Recalculate actual balance from earnings to check for sync issues
      const actualAvailableBalance = await WorkerEarning.aggregate([
        {
          $match: {
            workerId: workerIdStr,
            salonId: salon._id,
            isPaid: true,
            invoiceId: null
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$workerEarning' }
          }
        }
      ]);

      const actualBalance = actualAvailableBalance[0]?.total || 0;

      // Get wallet balance for comparison
      const wallet = await WorkerWallet.findOne({ workerId: workerIdStr });
      const walletBalance = wallet?.balance || 0;

      return res.status(400).json({
        success: false,
        message: availableToInvoice === 0 
          ? 'All paid earnings have already been invoiced. The displayed balance may be out of sync. Please recalculate the balance or wait for new paid earnings.'
          : 'No paid earnings available to invoice for this period. Worker must collect payments from clients first.',
        details: {
          totalPaidEarnings,
          alreadyInvoiced,
          unpaidEarnings,
          availableToInvoice,
          walletBalance,
          actualAvailableBalance: actualBalance,
          balanceOutOfSync: walletBalance !== actualBalance,
          periodStart: periodStart || 'all',
          periodEnd: periodEnd || 'all'
        }
      });
    }

    // Calculate total earnings
    const totalEarnings = earnings.reduce((sum, e) => sum + e.workerEarning, 0);

    // Get outstanding advances for this worker
    const outstandingAdvances = await WorkerAdvance.find({
      workerId: workerIdStr,
      salonId: salon._id,
      status: 'approved' // Only approved advances that haven't been deducted
    });

    const totalOutstandingAdvances = outstandingAdvances.reduce((sum, a) => sum + a.amount, 0);

    // Calculate net payment amount (earnings - advances)
    const totalAmount = Math.max(0, totalEarnings - totalOutstandingAdvances);

    // Generate invoice number
    const invoiceNumber = await WorkerInvoice.generateInvoiceNumber();

    // Calculate period dates - use provided dates or derive from earnings
    let invoicePeriodStart, invoicePeriodEnd;
    if (periodStart && periodEnd) {
      invoicePeriodStart = new Date(periodStart);
      invoicePeriodEnd = new Date(periodEnd);
    } else {
      // For "Pay All Balance" - use actual earnings date range
      const sortedEarnings = [...earnings].sort((a, b) => 
        new Date(a.serviceDate) - new Date(b.serviceDate)
      );
      invoicePeriodStart = sortedEarnings[0]?.serviceDate || new Date();
      invoicePeriodEnd = sortedEarnings[sortedEarnings.length - 1]?.serviceDate || new Date();
    }

    // Create invoice with advance deduction info
    const invoiceNotes = notes || '';
    const advanceNote = totalOutstandingAdvances > 0 
      ? `\n\nAdvances deducted: ${totalOutstandingAdvances.toFixed(2)} (Gross earnings: ${totalEarnings.toFixed(2)})`
      : '';
    
    const invoice = await WorkerInvoice.create({
      invoiceNumber,
      workerId: workerIdStr,
      salonId: salon._id,
      periodStart: invoicePeriodStart,
      periodEnd: invoicePeriodEnd,
      totalAmount, // Net amount after advance deduction
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
      notes: invoiceNotes + advanceNote,
      generatedBy: req.user.id
    });

    // Mark advances as deducted
    if (outstandingAdvances.length > 0) {
      await WorkerAdvance.updateMany(
        { _id: { $in: outstandingAdvances.map(a => a._id) } },
        {
          status: 'deducted',
          deductedAt: new Date(),
          invoiceId: invoice._id
        }
      );
    }

    // Mark earnings as invoiced (link to invoice)
    await WorkerEarning.updateMany(
      { _id: { $in: earnings.map(e => e._id) } },
      { 
        invoiceId: invoice._id
      }
    );

    // Update wallet
    let wallet = await WorkerWallet.findOne({ workerId: workerIdStr });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId: workerIdStr,
        salonId: salon._id,
        balance: 0,
        totalEarned: totalEarnings, // Total earnings before advance deduction
        totalPaid: totalAmount, // Net amount paid after advance deduction
        outstandingAdvances: 0 // All advances deducted
      });
    } else {
      // Balance represents gross earnings (before advances are deducted)
      // When generating invoice, we deduct the gross earnings from balance
      // and deduct the advances from outstandingAdvances
      // netBalance = balance - outstandingAdvances will correctly show available balance
      wallet.balance = Math.max(0, wallet.balance - totalEarnings); // Deduct gross earnings
      wallet.totalPaid += totalAmount; // Add net payment (earnings - advances)
      wallet.outstandingAdvances = Math.max(0, wallet.outstandingAdvances - totalOutstandingAdvances); // Deduct advances
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
 * @desc    Get invoice by ID (Owner only)
 * @route   GET /api/worker-finance/invoice/:invoiceId
 * @access  Private (Owner)
 */
const getInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;

    // SECURITY: Verify user is Owner
    if (req.user.role !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can view invoices'
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

    // Get invoice and verify it belongs to owner's salon
    const invoice = await WorkerInvoice.findById(invoiceId)
      .populate('workerId', 'name email phone')
      .populate('salonId', 'name phone email address')
      .populate('generatedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // SECURITY: Verify invoice belongs to owner's salon
    if (invoice.salonId._id.toString() !== salon._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this invoice'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all invoices for a worker (Owner only)
 * @route   GET /api/worker-finance/worker/:workerId/invoices
 * @access  Private (Owner)
 */
const getWorkerInvoices = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status, startDate, endDate } = req.query;

    // SECURITY: Verify user is Owner
    if (req.user.role !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can view worker invoices'
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

    // Build filter
    const filter = {
      workerId: workerId,
      salonId: salon._id
    };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Get invoices for this worker in owner's salon
    const invoices = await WorkerInvoice.find(filter)
      .populate('workerId', 'name email phone')
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
      // totalEarned = full service price (before commission)
      // balance = commission amount (what worker will receive)
      let wallet = await WorkerWallet.findOne({ workerId });
      if (!wallet) {
        wallet = await WorkerWallet.create({
          workerId,
          salonId: worker.salonId,
          balance: workerEarning, // Commission amount (what worker gets)
          totalEarned: servicePrice // Full service price (before commission)
        });
      } else {
        wallet.balance += workerEarning; // Add commission to balance
        wallet.totalEarned += servicePrice; // Add full service price to total earned
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
    // totalEarned = full service price (before commission)
    // balance = commission amount (what worker will receive)
    let wallet = await WorkerWallet.findOne({ workerId: req.user.id });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId: req.user.id,
        salonId: earning.salonId,
        balance: earning.workerEarning, // Commission amount (what worker gets)
        totalEarned: earning.servicePrice, // Full service price (before commission)
        totalPaid: 0
      });
    } else {
      wallet.balance += earning.workerEarning; // Add commission to balance
      wallet.totalEarned += earning.servicePrice; // Add full service price to total earned
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

/**
 * @desc    Recalculate worker wallet balance from actual earnings (Owner only)
 * @route   POST /api/worker-finance/recalculate-balance/:workerId
 * @access  Private (Owner)
 */
const recalculateWalletBalance = async (req, res, next) => {
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

    // Calculate actual balance from earnings (paid but not invoiced)
    const actualBalanceResult = await WorkerEarning.aggregate([
      {
        $match: {
          workerId,
          salonId: salon._id,
          isPaid: true,
          invoiceId: null
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$workerEarning' }
        }
      }
    ]);

    const actualBalance = actualBalanceResult[0]?.total || 0;

    // Calculate total earned and total paid
    // totalEarned = sum of servicePrice (full service prices, before commission)
    const totalEarnedResult = await WorkerEarning.aggregate([
      {
        $match: {
          workerId,
          salonId: salon._id
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$servicePrice' } // Sum of full service prices
        }
      }
    ]);

    const totalEarned = totalEarnedResult[0]?.total || 0;

    const totalPaidResult = await WorkerInvoice.aggregate([
      {
        $match: {
          workerId,
          salonId: salon._id,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalPaid = totalPaidResult[0]?.total || 0;

    // Update or create wallet
    let wallet = await WorkerWallet.findOne({ workerId });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId,
        salonId: salon._id,
        balance: actualBalance,
        totalEarned,
        totalPaid
      });
    } else {
      const oldBalance = wallet.balance;
      wallet.balance = actualBalance;
      wallet.totalEarned = totalEarned;
      wallet.totalPaid = totalPaid;
      await wallet.save();

      res.json({
        success: true,
        message: 'Wallet balance recalculated successfully',
        data: {
          wallet,
          oldBalance,
          newBalance: actualBalance,
          difference: actualBalance - oldBalance
        }
      });
      return;
    }

    res.json({
      success: true,
      message: 'Wallet created and balance calculated',
      data: { wallet }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Give advance to worker (Owner only)
 * @route   POST /api/worker-finance/give-advance
 * @access  Private (Owner)
 */
const giveAdvance = async (req, res, next) => {
  try {
    const { workerId, amount, reason, notes, paymentMethod } = req.body;

    // Validate required fields
    if (!workerId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Advance amount must be greater than 0'
      });
    }

    // SECURITY: Verify user is Owner
    if (req.user.role !== 'Owner') {
      return res.status(403).json({
        success: false,
        message: 'Only salon owners can give advances to workers'
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

    // Verify worker exists and belongs to salon
    const worker = await User.findOne({
      _id: workerId,
      salonId: salon._id,
      role: 'Worker'
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or does not belong to your salon'
      });
    }

    // Check advance limit if set
    let wallet = await WorkerWallet.findOne({ workerId });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId,
        salonId: salon._id,
        balance: 0,
        totalEarned: 0,
        totalPaid: 0,
        totalAdvances: 0,
        outstandingAdvances: 0
      });
    }

    if (wallet.advanceLimit && (wallet.outstandingAdvances + amount) > wallet.advanceLimit) {
      return res.status(400).json({
        success: false,
        message: `Advance limit exceeded. Current outstanding: ${wallet.outstandingAdvances}, Limit: ${wallet.advanceLimit}`
      });
    }

    // Create advance record
    const advance = await WorkerAdvance.create({
      workerId,
      salonId: salon._id,
      amount,
      reason: reason || '',
      status: 'approved',
      givenBy: req.user.id,
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash'
    });

    // Update wallet
    wallet.totalAdvances += amount;
    wallet.outstandingAdvances += amount;
    // DO NOT reduce balance here - balance represents gross earnings
    // netBalance calculation (balance - outstandingAdvances) will handle the deduction
    // This prevents double deduction: balance should stay as gross earnings
    await wallet.save();

    // Populate advance before sending
    const populatedAdvance = await WorkerAdvance.findById(advance._id)
      .populate('workerId', 'name email')
      .populate('givenBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Advance given successfully',
      data: populatedAdvance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker advances (Owner - all workers, Worker - own advances)
 * @route   GET /api/worker-finance/advances/:workerId?
 * @access  Private (Owner, Worker)
 */
const getWorkerAdvances = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { status } = req.query;

    // If workerId provided, owner can view any worker's advances
    if (workerId) {
      if (req.user.role !== 'Owner') {
        return res.status(403).json({
          success: false,
          message: 'Only owners can view other workers\' advances'
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

      const filter = {
        workerId,
        salonId: salon._id
      };

      if (status) {
        filter.status = status;
      }

      const advances = await WorkerAdvance.find(filter)
        .populate('workerId', 'name email')
        .populate('givenBy', 'name email')
        .populate('invoiceId', 'invoiceNumber')
        .sort({ createdAt: -1 });

      const totalOutstanding = advances
        .filter(a => a.status === 'approved')
        .reduce((sum, a) => sum + a.amount, 0);

      res.json({
        success: true,
        data: {
          advances,
          totalOutstanding,
          totalGiven: advances.reduce((sum, a) => sum + a.amount, 0)
        }
      });
    } else {
      // Worker viewing own advances
      if (req.user.role !== 'Worker') {
        return res.status(403).json({
          success: false,
          message: 'Only workers can view their own advances'
        });
      }

      const filter = {
        workerId: req.user.id
      };

      if (status) {
        filter.status = status;
      }

      const advances = await WorkerAdvance.find(filter)
        .populate('givenBy', 'name email')
        .populate('invoiceId', 'invoiceNumber')
        .sort({ createdAt: -1 });

      const totalOutstanding = advances
        .filter(a => a.status === 'approved')
        .reduce((sum, a) => sum + a.amount, 0);

      res.json({
        success: true,
        data: {
          advances,
          totalOutstanding,
          totalGiven: advances.reduce((sum, a) => sum + a.amount, 0)
        }
      });
    }
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
  getWorkerPaidEarnings,
  generateInvoice,
  getInvoice,
  getWorkerInvoices,
  recordEarning,
  getWorkerFinancialSummary,
  getEstimatedEarnings,
  recalculateWalletBalance,
  giveAdvance,
  getWorkerAdvances
};

