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
    // Handle both populated (object with _id) and non-populated (ObjectId) workerId
    let isWorker = false
    if (appointment.workerId) {
      const workerId = appointment.workerId._id 
        ? (appointment.workerId._id.toString ? appointment.workerId._id.toString() : appointment.workerId._id)
        : (appointment.workerId.toString ? appointment.workerId.toString() : appointment.workerId)
      isWorker = workerId === req.user.id
    }
    
    // Check if user is owner - handle both populated and non-populated salonId
    let isOwner = false;
    if (appointment.salonId) {
      if (appointment.salonId.ownerId) {
        // salonId is populated with ownerId
        const ownerId = appointment.salonId.ownerId.toString ? appointment.salonId.ownerId.toString() : appointment.salonId.ownerId;
        isOwner = ownerId === req.user.id;
      } else {
        // salonId is just an ObjectId, need to fetch salon
        const Salon = require('../models/Salon');
        const salon = await Salon.findById(appointment.salonId).select('ownerId');
        if (salon && salon.ownerId) {
          const ownerId = salon.ownerId.toString ? salon.ownerId.toString() : salon.ownerId;
          isOwner = ownerId === req.user.id;
        }
      }
    }

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
    // Handle both populated (object with _id) and non-populated (ObjectId) workerId
    let isWorker = false
    if (appointment.workerId) {
      const workerId = appointment.workerId._id 
        ? (appointment.workerId._id.toString ? appointment.workerId._id.toString() : appointment.workerId._id)
        : (appointment.workerId.toString ? appointment.workerId.toString() : appointment.workerId)
      isWorker = workerId === req.user.id
    }
    
    // Check if user is owner - handle both populated and non-populated salonId
    let isOwner = false;
    if (appointment.salonId) {
      if (appointment.salonId.ownerId) {
        // salonId is populated with ownerId
        const ownerId = appointment.salonId.ownerId.toString ? appointment.salonId.ownerId.toString() : appointment.salonId.ownerId;
        isOwner = ownerId === req.user.id;
      } else {
        // salonId is just an ObjectId, need to fetch salon
        const Salon = require('../models/Salon');
        const salon = await Salon.findById(appointment.salonId).select('ownerId');
        if (salon && salon.ownerId) {
          const ownerId = salon.ownerId.toString ? salon.ownerId.toString() : salon.ownerId;
          isOwner = ownerId === req.user.id;
        }
      }
    }

    if (!isWorker && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this appointment'
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
    
    // Update notes - handle anonymous bookings (no previous worker)
    if (oldWorkerId) {
      appointment.notes = (appointment.notes || '') + `\nReassigned from worker ${oldWorkerId} to worker ${newWorkerId} by owner`;
    } else {
      appointment.notes = (appointment.notes || '') + `\nWorker ${newWorkerId} assigned by owner`;
    }
    await appointment.save();

    await appointment.populate('workerId', 'name email');
    if (appointment.clientId) {
      await appointment.populate('clientId', 'name email');
    }
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
  const startTime = Date.now();
  console.log('[WALK-IN] ========== START WALK-IN REQUEST ==========');
  console.log('[WALK-IN] Request body:', JSON.stringify(req.body));
  console.log('[WALK-IN] Worker ID:', req.user?.id);
  console.log('[WALK-IN] Worker role:', req.user?.role);
  
  try {
    const { serviceId, price, paymentStatus, paymentMethod } = req.body;
    
    const workerId = req.user.id;
    console.log('[WALK-IN] Step 1: Extracted data - serviceId:', serviceId, 'price:', price, 'type:', typeof price);

    // Validate required fields
    if (!serviceId || price === undefined || price === null) {
      console.log('[WALK-IN] ❌ Validation failed - missing serviceId or price');
      return res.status(400).json({
        success: false,
        message: 'Service and price are required'
      });
    }

    // Convert price to number and validate
    const numericPrice = parseFloat(price);
    console.log('[WALK-IN] Step 2: Price conversion - original:', price, 'numeric:', numericPrice, 'isNaN:', isNaN(numericPrice));
    
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.log('[WALK-IN] ❌ Validation failed - invalid price');
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number'
      });
    }
    
    console.log('[WALK-IN] Step 3: Validation passed - proceeding without client creation');
    
    // Walk-in appointments don't require a client - set to null
    const finalClientId = null;
    console.log('[WALK-IN] Step 4: Walk-in appointment - no client required, clientId set to null');

    // Get worker and service in parallel (faster than sequential)
    console.log('[WALK-IN] Step 11: Fetching worker and service - workerId:', workerId, 'serviceId:', serviceId);
    let worker, service;
    try {
      const queryStart = Date.now();
      [worker, service] = await Promise.all([
        User.findById(workerId).select('salonId paymentModel').maxTimeMS(3000),
        Service.findById(serviceId).select('name duration price').maxTimeMS(3000)
      ]);
      const queryDuration = Date.now() - queryStart;
      console.log('[WALK-IN] Step 11: Queries completed in', queryDuration, 'ms');
      console.log('[WALK-IN] Worker found:', !!worker, 'Service found:', !!service);
      if (worker) console.log('[WALK-IN] Worker salonId:', worker.salonId);
      if (service) console.log('[WALK-IN] Service name:', service.name, 'duration:', service.duration);
    } catch (queryError) {
      console.error('[WALK-IN] ❌ Error fetching worker/service:', queryError.message);
      console.error('[WALK-IN] Error stack:', queryError.stack);
      return res.status(500).json({
        success: false,
        message: 'Error fetching worker or service information'
      });
    }

    if (!worker || !worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker must be assigned to a salon'
      });
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const salonId = worker.salonId;
    console.log('[WALK-IN] Step 12: Salon ID:', salonId);

    // Calculate worker earnings (before creating appointment)
    console.log('[WALK-IN] Step 13: Calculating earnings - price:', numericPrice, 'paymentModel:', worker.paymentModel);
    let workerEarning = 0;
    let commissionPercentage = 0;

    if (worker.paymentModel && worker.paymentModel.type) {
      if (worker.paymentModel.type === 'percentage_commission') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 50;
        workerEarning = (numericPrice * commissionPercentage) / 100;
      } else if (worker.paymentModel.type === 'hybrid') {
        commissionPercentage = worker.paymentModel.commissionPercentage || 30;
        workerEarning = (numericPrice * commissionPercentage) / 100;
      }
    } else {
      commissionPercentage = 50;
      workerEarning = (numericPrice * 50) / 100;
    }
    console.log('[WALK-IN] Step 13: Earnings calculated - commission:', commissionPercentage, 'workerEarning:', workerEarning);

    const isPaid = paymentStatus === 'paid';
    const now = new Date();
    console.log('[WALK-IN] Step 14: Payment status - isPaid:', isPaid, 'now:', now);

    // Create appointment (minimal fields, no populate)
    console.log('[WALK-IN] Step 15: Creating appointment with data:', {
      clientId: finalClientId,
      workerId,
      serviceId,
      salonId,
      price: numericPrice
    });
    let appointment;
    try {
      const appointmentData = {
        clientId: null, // No client for walk-in appointments
        workerId,
        serviceId,
        salonId: salonId,
        dateTime: now,
        status: 'Completed',
        isWalkIn: true,
        servicePriceAtBooking: numericPrice,
        finalPrice: numericPrice,
        serviceDurationAtBooking: service.duration || 0,
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: paymentMethod || 'cash',
        paidAmount: isPaid ? numericPrice : 0,
        paidAt: isPaid ? now : null,
        completedAt: now,
        notes: 'Walk-in service (no client account)'
      };
      console.log('[WALK-IN] Step 15: Appointment data prepared, creating...');
      appointment = await Appointment.create(appointmentData);
      console.log('[WALK-IN] Step 15: ✅ Appointment created successfully:', appointment._id);
    } catch (appointmentError) {
      console.error('[WALK-IN] ❌ Error creating appointment:', appointmentError.message);
      console.error('[WALK-IN] Error name:', appointmentError.name);
      console.error('[WALK-IN] Error code:', appointmentError.code);
      console.error('[WALK-IN] Error stack:', appointmentError.stack);
      return res.status(500).json({
        success: false,
        message: 'Error creating appointment. Please try again.'
      });
    }

    // CRITICAL: Create finance records SYNCHRONOUSLY so they appear immediately
    // WorkerEarning and Payment must be created before response to show in finance
    console.log('[WALK-IN] Step 16: Creating finance records');
    try {
      // Create earning record (CRITICAL - must be synchronous)
      const earningData = {
        workerId,
        salonId: salonId,
        appointmentId: appointment._id,
        serviceId,
        servicePrice: numericPrice,
        commissionPercentage,
        workerEarning,
        paymentModelType: worker.paymentModel?.type || 'percentage_commission',
        isPaid,
        serviceDate: now
      };
      console.log('[WALK-IN] Step 16a: Creating WorkerEarning with data:', earningData);
      await WorkerEarning.create(earningData);
      console.log('[WALK-IN] Step 16a: ✅ WorkerEarning created successfully');

      // Create payment record if paid (CRITICAL - must be synchronous for owner finance)
      if (isPaid) {
        const salonRevenue = numericPrice - workerEarning;
      const paymentData = {
        salonId: salonId,
        appointmentId: appointment._id,
        clientId: null, // No client for walk-ins
        workerId,
        amount: numericPrice,
        paymentMethod: paymentMethod || 'cash',
        status: 'completed',
        paidAt: now,
        workerCommission: {
          percentage: commissionPercentage,
          amount: workerEarning
        },
        salonRevenue,
        notes: `Walk-in payment for ${service.name || 'service'}`
      };
        console.log('[WALK-IN] Step 16b: Creating Payment with data:', paymentData);
        await Payment.create(paymentData);
        console.log('[WALK-IN] Step 16b: ✅ Payment created successfully');
      } else {
        console.log('[WALK-IN] Step 16b: Skipping payment creation (not paid)');
      }
    } catch (financeError) {
      // Log but don't fail the request - finance records are important but appointment is created
      console.error('[WALK-IN] ❌ Error creating finance records:', financeError.message);
      console.error('[WALK-IN] Error name:', financeError.name);
      console.error('[WALK-IN] Error code:', financeError.code);
      console.error('[WALK-IN] Finance error stack:', financeError.stack);
      // Continue - appointment is already created, finance can be fixed later
    }

    // Return response
    const totalDuration = Date.now() - startTime;
    console.log('[WALK-IN] Step 17: Preparing response - total duration:', totalDuration, 'ms');
    const responseData = {
      success: true,
      message: 'Walk-in appointment created successfully',
      data: {
        _id: appointment._id,
        clientId: null, // No client for walk-ins
        workerId,
        serviceId,
        salonId,
        dateTime: appointment.dateTime,
        status: appointment.status,
        isWalkIn: true,
        finalPrice: numericPrice,
        paymentStatus: appointment.paymentStatus,
        paymentMethod: appointment.paymentMethod
      }
    };
    console.log('[WALK-IN] Step 17: Sending response:', JSON.stringify(responseData));
    res.status(201).json(responseData);
    console.log('[WALK-IN] ========== WALK-IN REQUEST COMPLETED SUCCESSFULLY ==========');

    // Update wallet ASYNCHRONOUSLY (less critical - can happen in background)
    // Note: Response already sent, so errors here won't affect the user
    if (isPaid) {
      setImmediate(async () => {
        try {
          const wallet = await WorkerWallet.findOne({ workerId }).maxTimeMS(2000);
          if (!wallet) {
            await WorkerWallet.create({
              workerId,
              salonId: salonId,
              balance: workerEarning,
              totalEarned: workerEarning,
              totalPaid: 0
            });
            console.log('[WALK-IN] ✅ Worker wallet created in background');
          } else {
            wallet.balance += workerEarning;
            wallet.totalEarned += workerEarning;
            await wallet.save();
            console.log('[WALK-IN] ✅ Worker wallet updated in background');
          }
        } catch (walletError) {
          // Log but don't throw - this is background operation and response already sent
          console.error('[WALK-IN] ⚠️ Error updating worker wallet (background):', walletError.message);
          console.error('[WALK-IN] Wallet error stack:', walletError.stack);
        }
      });
    }
  } catch (error) {
    // Log the error with full details for debugging
    const totalDuration = Date.now() - startTime;
    console.error('[WALK-IN] ========== WALK-IN REQUEST FAILED ==========');
    console.error('[WALK-IN] Total duration before error:', totalDuration, 'ms');
    console.error('[WALK-IN] ❌ Unhandled error:', error.message);
    console.error('[WALK-IN] Error name:', error.name);
    console.error('[WALK-IN] Error code:', error.code);
    console.error('[WALK-IN] Error stack:', error.stack);
    if (error.errors) {
      console.error('[WALK-IN] Validation errors:', JSON.stringify(error.errors));
    }
    console.error('[WALK-IN] Request body was:', JSON.stringify(req.body));
    console.error('[WALK-IN] Worker ID was:', req.user?.id);
    console.error('[WALK-IN] ============================================');
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error creating walk-in appointment'
      });
    } else {
      // Response already sent, just log the error
      console.error('[WALK-IN] ⚠️ Error occurred after response was sent - ignoring');
    }
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

