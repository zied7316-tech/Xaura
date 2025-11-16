const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');
const WorkerEarning = require('../models/WorkerEarning');
const WorkerWallet = require('../models/WorkerWallet');
const Payment = require('../models/Payment');
const Salon = require('../models/Salon');
const { createNotification } = require('./notificationController');
const { awardPoints } = require('./loyaltyController');

/**
 * @desc    Worker accepts appointment
 * @route   PUT /api/appointments/:id/accept
 * @access  Private (Worker)
 */
const acceptAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('salonId', 'ownerId')
      .populate('serviceId', 'name duration price')
      .populate('workerId', 'name')
      .populate('clientId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Allow both worker and owner to accept
    const isWorker = appointment.workerId.toString() === req.user.id;
    const isOwner = appointment.salonId.ownerId.toString() === req.user.id;

    if (!isWorker && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this appointment'
      });
    }

    if (appointment.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is not pending'
      });
    }

    appointment.status = 'Confirmed';
    appointment.acceptedAt = new Date(); // Track when accepted
    await appointment.save();

    // Notify client that appointment was confirmed
    await createNotification({
      userId: appointment.clientId._id,
      salonId: appointment.salonId._id,
      type: 'appointment_confirmed',
      title: 'Appointment Confirmed!',
      message: `Your appointment for ${appointment.serviceId.name} with ${appointment.workerId.name} is confirmed`,
      relatedAppointment: appointment._id,
      priority: 'normal',
      data: {
        serviceName: appointment.serviceId.name,
        workerName: appointment.workerId.name,
        dateTime: appointment.dateTime
      }
    });

    res.json({
      success: true,
      message: isOwner ? 'Appointment accepted by owner' : 'Appointment accepted',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker rejects appointment
 * @route   PUT /api/appointments/:id/reject
 * @access  Private (Worker)
 */
const rejectAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('salonId', 'ownerId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Allow both worker and owner to reject
    const isWorker = appointment.workerId.toString() === req.user.id;
    const isOwner = appointment.salonId.ownerId.toString() === req.user.id;

    if (!isWorker && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    appointment.status = 'Cancelled';
    appointment.rejectedAt = new Date(); // Track when rejected
    appointment.notes = reason || (isOwner ? 'Cancelled by salon owner' : 'Rejected by worker');
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark appointment as in progress (service started)
 * @route   PUT /api/appointments/:id/start
 * @access  Private (Worker)
 */
const startAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.workerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (appointment.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be confirmed first'
      });
    }

    appointment.status = 'In Progress';
    appointment.startedAt = new Date(); // Track when service started
    await appointment.save();

    res.json({
      success: true,
      message: 'Service started',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Complete appointment and process payment
 * @route   PUT /api/appointments/:id/complete
 * @access  Private (Worker)
 */
const completeAppointment = async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, finalPrice } = req.body;

    if (!['paid', 'waiting'].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Payment status must be either "paid" or "waiting"'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('serviceId', 'name price')
      .populate('clientId', 'name email')
      .populate('workerId', 'name paymentModel');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.workerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const originalPrice = appointment.servicePriceAtBooking || appointment.serviceId.price;
    
    // Use finalPrice if provided (worker adjusted), otherwise use original
    const actualPrice = finalPrice && finalPrice > 0 ? finalPrice : originalPrice;
    const priceWasAdjusted = finalPrice && finalPrice !== originalPrice;

    // Update appointment
    appointment.status = 'Completed';
    appointment.completedAt = new Date(); // Track when service completed
    appointment.paymentStatus = paymentStatus;
    appointment.paymentMethod = paymentMethod || 'cash';
    
    // Store final price if adjusted
    if (priceWasAdjusted) {
      appointment.finalPrice = actualPrice;
    }
    
    if (paymentStatus === 'paid') {
      appointment.paidAmount = actualPrice;
      appointment.paidAt = new Date();
    }

    await appointment.save();

    // Calculate worker earnings
    const worker = appointment.workerId;
    let workerEarning = 0;
    let commissionPercentage = 0;

    // Check if worker has payment model configured
    if (worker.paymentModel && worker.paymentModel.type) {
      if (worker.paymentModel.type === 'percentage_commission') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 50;
        workerEarning = (actualPrice * commissionPercentage) / 100;
      } else if (worker.paymentModel.type === 'hybrid') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 30;
        workerEarning = (actualPrice * commissionPercentage) / 100;
      }
    } else {
      // Default: 50% commission if no payment model set
      commissionPercentage = 50;
      workerEarning = (actualPrice * 50) / 100;
    }

    // Process based on payment status
    if (paymentStatus === 'paid') {
      // CLIENT PAID - Add to worker balance immediately
      
      // Create earning record (marked as paid)
      await WorkerEarning.create({
        workerId: worker._id,
        salonId: appointment.salonId,
        appointmentId: appointment._id,
        serviceId: appointment.serviceId._id,
        servicePrice: actualPrice,
        originalPrice: priceWasAdjusted ? originalPrice : null,
        finalPrice: priceWasAdjusted ? actualPrice : null,
        commissionPercentage,
        workerEarning,
        paymentModelType: worker.paymentModel?.type || 'percentage_commission',
        isPaid: true,  // Client paid immediately
        serviceDate: new Date()
      });

      // Update wallet balance immediately
      let wallet = await WorkerWallet.findOne({ workerId: worker._id });
      if (!wallet) {
        wallet = await WorkerWallet.create({
          workerId: worker._id,
          salonId: appointment.salonId,
          balance: workerEarning,
          totalEarned: workerEarning,
          totalPaid: 0
        });
      } else {
        wallet.balance += workerEarning;
        wallet.totalEarned += workerEarning;
        await wallet.save();
      }

      // Record payment in finances
      const salonRevenue = actualPrice - workerEarning;
      
      await Payment.create({
        salonId: appointment.salonId,
        appointmentId: appointment._id,
        clientId: appointment.clientId._id,
        workerId: worker._id,
        amount: actualPrice,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        paidAt: new Date(),
        workerCommission: {
          percentage: commissionPercentage,
          amount: workerEarning
        },
        salonRevenue: salonRevenue,
        notes: `Payment for ${appointment.serviceId.name}`
      });
    } else {
      // CLIENT DIDN'T PAY - Create unpaid earning record
      
      await WorkerEarning.create({
        workerId: worker._id,
        salonId: appointment.salonId,
        appointmentId: appointment._id,
        serviceId: appointment.serviceId._id,
        servicePrice: actualPrice,
        originalPrice: priceWasAdjusted ? originalPrice : null,
        finalPrice: priceWasAdjusted ? actualPrice : null,
        commissionPercentage,
        workerEarning,
        paymentModelType: worker.paymentModel?.type || 'percentage_commission',
        isPaid: false,  // Client hasn't paid yet
        serviceDate: new Date()
      });
      
      // Note: Wallet NOT updated - will update when client pays later
    }

    // 3. Set worker back to available
    await User.findByIdAndUpdate(req.user.id, {
      currentStatus: 'available'
    });

    // 4. Send notifications
    const salon = await Salon.findById(appointment.salonId);
    
    // Notify client
    await createNotification({
      userId: appointment.clientId._id,
      salonId: appointment.salonId,
      type: 'appointment_confirmed',
      title: 'Service Completed!',
      message: `Your ${appointment.serviceId.name} service is complete. ${paymentStatus === 'paid' ? 'Payment received' : 'Payment pending'}`,
      relatedAppointment: appointment._id,
      priority: 'normal'
    });

    // Notify owner if payment received
    if (salon && salon.ownerId && paymentStatus === 'paid') {
      await createNotification({
        userId: salon.ownerId,
        salonId: appointment.salonId,
        type: 'payment_received',
        title: 'Payment Received',
        message: `$${actualPrice.toFixed(2)} received from ${appointment.clientId.name}`,
        relatedAppointment: appointment._id,
        priority: 'normal',
        data: {
          amount: actualPrice,
          clientName: appointment.clientId.name
        }
      });
    }

    // 5. Award loyalty points if payment received
    if (paymentStatus === 'paid') {
      await awardPoints(appointment._id);
    }

    res.json({
      success: true,
      message: paymentStatus === 'paid' 
        ? 'Appointment completed and payment recorded' 
        : 'Appointment completed, payment pending',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending appointments for worker
 * @route   GET /api/appointments/worker/pending
 * @access  Private (Worker)
 */
const getWorkerPendingAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      workerId: req.user.id,
      status: 'Pending'
    })
      .populate('clientId', 'name email phone avatar')
      .populate('serviceId', 'name duration price')
      .populate('salonId', 'name')
      .sort({ dateTime: 1 });  // Fixed: use dateTime not startTime

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active/confirmed appointments for worker (upcoming)
 * @route   GET /api/appointments/worker/active
 * @access  Private (Worker)
 */
const getWorkerActiveAppointments = async (req, res, next) => {
  try {
    const now = new Date();

    const appointments = await Appointment.find({
      workerId: req.user.id,
      status: { $in: ['Confirmed', 'In Progress'] },
      dateTime: { $gte: now }  // All future confirmed appointments
    })
      .populate('clientId', 'name email phone avatar')
      .populate('serviceId', 'name duration price')
      .sort({ dateTime: 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reassign appointment to another worker (Owner only)
 * @route   PUT /api/appointment-management/:id/reassign
 * @access  Private (Owner)
 */
const reassignAppointment = async (req, res, next) => {
  try {
    const { newWorkerId } = req.body;

    if (!newWorkerId) {
      return res.status(400).json({
        success: false,
        message: 'New worker ID is required'
      });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('salonId', 'ownerId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Only owner can reassign
    const isOwner = appointment.salonId.ownerId.toString() === req.user.id;
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only salon owner can reassign appointments'
      });
    }

    // Verify new worker exists and belongs to this salon
    const newWorker = await User.findById(newWorkerId);
    if (!newWorker || newWorker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    if (newWorker.salonId.toString() !== appointment.salonId._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Worker does not belong to this salon'
      });
    }

    // Update appointment
    const oldWorkerId = appointment.workerId;
    appointment.workerId = newWorkerId;
    
    // If appointment was confirmed, set back to pending for new worker to accept
    if (appointment.status === 'Confirmed') {
      appointment.status = 'Pending';
      appointment.acceptedAt = null;
    }
    
    appointment.notes = `Reassigned from worker ${oldWorkerId} to worker ${newWorkerId} by owner`;
    await appointment.save();

    await appointment.populate('workerId', 'name email');
    await appointment.populate('clientId', 'name email');
    await appointment.populate('serviceId', 'name price duration');

    res.json({
      success: true,
      message: 'Appointment reassigned successfully',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create walk-in appointment (client came without booking)
 * @route   POST /api/appointment-management/walk-in
 * @access  Private (Worker)
 */
const createWalkInAppointment = async (req, res, next) => {
  try {
    const { clientId, serviceId, price, paymentStatus, paymentMethod, clientName, clientPhone, clientEmail } = req.body;
    
    const workerId = req.user.id;

    // Validate required fields
    if (!serviceId || !price) {
      return res.status(400).json({
        success: false,
        message: 'Service and price are required'
      });
    }

    // If no clientId provided, check if we have client info
    let finalClientId = clientId;
    
    if (!finalClientId) {
      // If phone provided, try to find/create client
      if (clientPhone) {
        // Try to find existing client by phone
        let client = await User.findOne({ phone: clientPhone, role: 'Client' });
        
        if (!client) {
          // Create new client account
          client = await User.create({
            name: clientName || 'Walk-in Client',
            phone: clientPhone,
            email: clientEmail || `${clientPhone}@walkin.temp`,
            role: 'Client',
            password: Math.random().toString(36).slice(-8), // Temporary password
            isWalkIn: true // Flag for walk-in clients
          });
        }
        
        finalClientId = client._id;
      } else {
        // No client info - create anonymous walk-in client
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 1000);
        const client = await User.create({
          name: clientName || `Walk-in #${randomNum}`,
          phone: `WALKIN${timestamp}`,
          email: `walkin${timestamp}@temp.anon`,
          role: 'Client',
          password: Math.random().toString(36).slice(-8),
          isWalkIn: true,
          isAnonymous: true
        });
        
        finalClientId = client._id;
      }
    }

    // Get worker's salon
    const worker = await User.findById(workerId).populate('salonId');
    if (!worker || !worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker must be assigned to a salon'
      });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      clientId: finalClientId,
      workerId,
      serviceId,
      salonId: worker.salonId._id,
      dateTime: new Date(), // Walk-in = right now
      status: 'Completed', // Already completed
      isWalkIn: true,
      servicePriceAtBooking: price,
      finalPrice: price,
      serviceDurationAtBooking: service.duration,
      paymentStatus: paymentStatus || 'paid',
      paymentMethod: paymentMethod || 'cash',
      paidAmount: paymentStatus === 'paid' ? price : 0,
      paidAt: paymentStatus === 'paid' ? new Date() : null,
      completedAt: new Date(),
      notes: 'Walk-in client'
    });

    // Calculate worker earnings
    let workerEarning = 0;
    let commissionPercentage = 0;

    if (worker.paymentModel && worker.paymentModel.type) {
      if (worker.paymentModel.type === 'percentage_commission') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 50;
        workerEarning = (price * commissionPercentage) / 100;
      } else if (worker.paymentModel.type === 'hybrid') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 30;
        workerEarning = (price * commissionPercentage) / 100;
      }
    } else {
      commissionPercentage = 50;
      workerEarning = (price * 50) / 100;
    }

    // Create earning record
    const isPaid = paymentStatus === 'paid';
    await WorkerEarning.create({
      workerId,
      salonId: worker.salonId._id,
      appointmentId: appointment._id,
      serviceId,
      servicePrice: price,
      commissionPercentage,
      workerEarning,
      paymentModelType: worker.paymentModel?.type || 'percentage_commission',
      isPaid,
      serviceDate: new Date()
    });

    // Update wallet if paid
    if (isPaid) {
      let wallet = await WorkerWallet.findOne({ workerId });
      if (!wallet) {
        wallet = await WorkerWallet.create({
          workerId,
          salonId: worker.salonId._id,
          balance: workerEarning,
          totalEarned: workerEarning,
          totalPaid: 0
        });
      } else {
        wallet.balance += workerEarning;
        wallet.totalEarned += workerEarning;
        await wallet.save();
      }

      // Record payment
      const salonRevenue = price - workerEarning;
      await Payment.create({
        salonId: worker.salonId._id,
        appointmentId: appointment._id,
        clientId: finalClientId,
        workerId,
        amount: price,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        paidAt: new Date(),
        workerCommission: {
          percentage: commissionPercentage,
          amount: workerEarning
        },
        salonRevenue,
        notes: `Walk-in payment for ${service.name}`
      });
    }

    // Populate appointment details
    await appointment.populate('clientId', 'name phone email');
    await appointment.populate('serviceId', 'name price');
    await appointment.populate('workerId', 'name');

    res.status(201).json({
      success: true,
      message: 'Walk-in appointment created successfully',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  acceptAppointment,
  rejectAppointment,
  startAppointment,
  completeAppointment,
  getWorkerPendingAppointments,
  getWorkerActiveAppointments,
  reassignAppointment,
  createWalkInAppointment
};

