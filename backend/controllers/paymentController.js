const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const Salon = require('../models/Salon');
const { validationResult } = require('express-validator');

/**
 * @desc    Record a payment
 * @route   POST /api/payments
 * @access  Private (Owner, Worker)
 */
const createPayment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { appointmentId, paymentMethod, workerCommissionPercentage = 50 } = req.body;

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate('clientId workerId serviceId salonId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization (owner or worker of the salon)
    const isOwner = appointment.salonId.ownerId.toString() === req.user.id;
    const isWorker = appointment.workerId._id.toString() === req.user.id;

    if (!isOwner && !isWorker) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to record payment for this appointment'
      });
    }

    // Calculate commissions
    const amount = appointment.servicePriceAtBooking;
    const commissionAmount = (amount * workerCommissionPercentage) / 100;
    const salonRevenue = amount - commissionAmount;

    const payment = await Payment.create({
      appointmentId,
      salonId: appointment.salonId._id,
      clientId: appointment.clientId._id,
      workerId: appointment.workerId._id,
      amount,
      paymentMethod,
      status: 'completed',
      workerCommission: {
        percentage: workerCommissionPercentage,
        amount: commissionAmount
      },
      salonRevenue,
      paidAt: new Date()
    });

    // Update appointment status to completed
    appointment.status = 'completed';
    await appointment.save();

    // Create commission record
    const Commission = require('../models/Commission');
    const date = new Date();
    await Commission.create({
      workerId: appointment.workerId._id,
      salonId: appointment.salonId._id,
      appointmentId,
      paymentId: payment._id,
      serviceAmount: amount,
      commissionPercentage: workerCommissionPercentage,
      commissionAmount,
      period: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        week: Math.ceil(date.getDate() / 7)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payments for salon
 * @route   GET /api/payments
 * @access  Private (Owner, Worker)
 */
const getPayments = async (req, res, next) => {
  try {
    const { status, startDate, endDate, workerId } = req.query;
    
    // Get user's salon
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon && req.user.role === 'Owner') {
      return res.json({
        success: true,
        count: 0,
        data: { payments: [] }
      });
    }

    const filter = {};
    
    if (req.user.role === 'Owner') {
      filter.salonId = salon._id;
    } else if (req.user.role === 'Worker') {
      filter.workerId = req.user.id;
    }

    if (status) filter.status = status;
    if (workerId && req.user.role === 'Owner') filter.workerId = workerId;
    
    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name')
      .populate('appointmentId', 'dateTime')
      .sort({ paidAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get revenue summary
 * @route   GET /api/payments/revenue
 * @access  Private (Owner)
 */
const getRevenueSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.json({
        success: true,
        data: { totalRevenue: 0, totalCommissions: 0, netRevenue: 0, paymentCount: 0 }
      });
    }

    const filter = { salonId: salon._id, status: 'completed' };
    
    if (startDate || endDate) {
      filter.paidAt = {};
      if (startDate) filter.paidAt.$gte = new Date(startDate);
      if (endDate) filter.paidAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommissions = payments.reduce((sum, p) => sum + p.workerCommission.amount, 0);
    const netRevenue = payments.reduce((sum, p) => sum + p.salonRevenue, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCommissions,
        netRevenue,
        paymentCount: payments.length,
        averageTransaction: payments.length > 0 ? totalRevenue / payments.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayment,
  getPayments,
  getRevenueSummary
};

