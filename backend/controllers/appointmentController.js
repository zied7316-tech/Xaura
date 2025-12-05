const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');
const Salon = require('../models/Salon');
const { validationResult } = require('express-validator');
const { isSlotAvailable, getAvailableSlots, isDateInFuture } = require('../utils/appointmentHelpers');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Client)
 */
const createAppointment = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { workerId, serviceId, services, dateTime, notes, skipAvailabilityCheck } = req.body;

    console.log('Creating appointment:', {
      workerId,
      serviceId,
      services,
      dateTime,
      clientId: req.user.id
    });

    // Validate that at least one service is provided
    if (!serviceId && (!services || !Array.isArray(services) || services.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Either serviceId or services array is required'
      });
    }

    // Validate date is in the future
    if (!isDateInFuture(dateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Support multiple services or single service (backward compatibility)
    let servicesToBook = [];
    if (services && Array.isArray(services) && services.length > 0) {
      // Multiple services
      servicesToBook = services;
    } else if (serviceId) {
      // Single service (backward compatibility)
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or inactive'
        });
      }
      servicesToBook = [{
        serviceId: service._id,
        name: service.name,
        price: service.price,
        duration: service.duration
      }];
    } else {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    // Verify all services exist and are active
    const serviceIds = servicesToBook.map(s => s.serviceId);
    const verifiedServices = await Service.find({ _id: { $in: serviceIds }, isActive: true });
    
    if (verifiedServices.length !== serviceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more services not found or inactive'
      });
    }

    // Use first service for validation (all should be from same salon)
    const firstService = verifiedServices[0];

    // Verify worker exists and is active
    const worker = await User.findById(workerId);
    
    // Check if user is a regular worker or an owner who works as worker
    const isWorker = worker && worker.role === 'Worker';
    const isWorkingOwner = worker && worker.role === 'Owner' && worker.worksAsWorker;
    
    if (!worker || (!isWorker && !isWorkingOwner) || !worker.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or inactive'
      });
    }

    // For regular workers, check salonId
    // For owners, check if they own the salon (handled below)
    if (isWorker && !worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker is not assigned to a salon'
      });
    }

    // Check if first service has salonId
    if (!firstService.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Service is not assigned to a salon'
      });
    }

    // Verify all services belong to the same salon and worker belongs to that salon
    const serviceSalonId = firstService.salonId.toString();
    
    // Check all services are from the same salon
    const allSameSalon = verifiedServices.every(s => s.salonId.toString() === serviceSalonId);
    if (!allSameSalon) {
      return res.status(400).json({
        success: false,
        message: 'All services must be from the same salon'
      });
    }
    
    // For regular workers, check salonId match
    // For owners who work as workers, check if they own the salon
    if (isWorker) {
      const workerSalonId = worker.salonId.toString();
      if (workerSalonId !== serviceSalonId) {
        console.error('Salon mismatch:', {
          workerId: worker._id,
          workerSalonId,
          serviceSalonId
        });
        return res.status(400).json({
          success: false,
          message: 'Worker does not belong to the salon offering these services'
        });
      }
    } else if (isWorkingOwner) {
      // For owner, verify they own the salon
      const salon = await Salon.findById(serviceSalonId).select('ownerId');
      if (!salon || salon.ownerId.toString() !== worker._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Owner does not own the salon offering these services'
        });
      }
    }

    // Calculate total duration for all services
    const totalDuration = servicesToBook.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPrice = servicesToBook.reduce((sum, s) => sum + (s.price || 0), 0);

    // Check if time slot is available (using total duration)
    // Skip check for multi-person bookings (skipAvailabilityCheck flag)
    if (!skipAvailabilityCheck) {
      const available = await isSlotAvailable(workerId, dateTime, totalDuration);
      if (!available) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is not available. Please choose another time.'
        });
      }
    }

    // Create appointment with multiple services
    const appointment = await Appointment.create({
      clientId: req.user.id,
      workerId,
      serviceId: servicesToBook[0].serviceId, // Keep for backward compatibility
      services: servicesToBook, // Array of services
      salonId: firstService.salonId,
      dateTime,
      notes: notes || '',
      servicePriceAtBooking: totalPrice,
      serviceDurationAtBooking: totalDuration,
      status: 'Pending' // Use capitalized to match enum
    });

    console.log('Appointment created:', {
      id: appointment._id,
      clientId: appointment.clientId,
      workerId: appointment.workerId,
      serviceId: appointment.serviceId,
      salonId: appointment.salonId,
      dateTime: appointment.dateTime,
      status: appointment.status
    });

    // Populate appointment details
    await appointment.populate([
      { path: 'clientId', select: 'name email phone role' },
      { path: 'workerId', select: 'name email phone role' },
      { path: 'serviceId', select: 'name duration price category' },
      { path: 'salonId', select: 'name address phone ownerId' }
    ]);

    // Create notifications for worker and owner
    const salon = await Salon.findById(firstService.salonId);
    const serviceNames = servicesToBook.map(s => s.name).join(', ');
    
    // Log history for client and worker
    const { logUserHistory } = require('../utils/userHistoryLogger');
    
    // Check if this is client's first appointment
    const previousAppointments = await Appointment.countDocuments({ 
      clientId: req.user.id,
      _id: { $ne: appointment._id }
    });
    
    if (previousAppointments === 0) {
      // First appointment
      await logUserHistory({
        userId: req.user.id,
        userRole: 'Client',
        action: 'first_appointment',
        description: `Booked first appointment: ${serviceNames}`,
        relatedEntity: {
          type: 'Appointment',
          id: appointment._id,
          name: serviceNames
        },
        metadata: { salonId: firstService.salonId, workerId },
        req
      });
    } else {
      // Regular appointment
      await logUserHistory({
        userId: req.user.id,
        userRole: 'Client',
        action: 'appointment_booked',
        description: `Booked appointment: ${serviceNames}`,
        relatedEntity: {
          type: 'Appointment',
          id: appointment._id,
          name: serviceNames
        },
        metadata: { salonId: firstService.salonId, workerId },
        req
      });
    }

    // Log for worker
    if (appointment.workerId) {
      await logUserHistory({
        userId: appointment.workerId._id,
        userRole: 'Worker',
        action: 'appointment_created',
        description: `New appointment booked by ${appointment.clientId.name}`,
        relatedEntity: {
          type: 'Appointment',
          id: appointment._id,
          name: serviceNames
        },
        metadata: { clientId: req.user.id, salonId: firstService.salonId },
        req
      });
    }
    
    // Notify worker
    await createNotification({
      userId: workerId,
      salonId: firstService.salonId,
      type: 'new_appointment',
      title: 'New Appointment Request',
      message: `${appointment.clientId.name} wants to book ${serviceNames}`,
      relatedAppointment: appointment._id,
      relatedUser: req.user.id,
      priority: 'high',
      data: {
        clientName: appointment.clientId.name,
        serviceName: serviceNames,
        dateTime: appointment.dateTime
      }
    });

    // Notify owner
    if (salon && salon.ownerId) {
      await createNotification({
        userId: salon.ownerId,
        salonId: firstService.salonId,
        type: 'new_appointment',
        title: 'New Appointment Request',
        message: `${appointment.clientId.name} booked ${serviceNames} with ${worker.name}`,
        relatedAppointment: appointment._id,
        priority: 'normal',
        data: {
          clientName: appointment.clientId.name,
          workerName: worker.name,
          serviceName: serviceNames,
          dateTime: appointment.dateTime
        }
      });
    }

    // Send WhatsApp confirmation to client and worker
    try {
      console.log('[AppointmentController] Attempting to send WhatsApp confirmation...');
      const notificationService = require('../services/notificationService');
      // Appointment is already populated with clientId, workerId, serviceId, salonId
      console.log('[AppointmentController] Appointment data for WhatsApp:', {
        appointmentId: appointment._id,
        clientId: appointment.clientId._id || appointment.clientId,
        clientPhone: appointment.clientId.phone,
        workerId: appointment.workerId._id || appointment.workerId,
        workerPhone: appointment.workerId.phone,
        salonId: appointment.salonId._id || appointment.salonId,
        serviceId: appointment.serviceId._id || appointment.serviceId
      });
      await notificationService.sendAppointmentConfirmation(appointment);
      console.log('[AppointmentController] ✅ WhatsApp confirmation attempt completed');
    } catch (error) {
      console.error('[AppointmentController] ❌ Failed to send WhatsApp confirmation:', error);
      console.error('[AppointmentController] Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Don't fail appointment creation if WhatsApp fails - just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
};

/**
 * @desc    Get appointments (filtered by user role)
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = async (req, res, next) => {
  try {
    const { status, date, salonId } = req.query;
    let filter = {};

    console.log('getAppointments - User role:', req.user.role, 'User ID:', req.user.id);

    // Filter based on user role
    if (req.user.role === 'Client') {
      filter.clientId = req.user.id;
      console.log('Client filter:', filter);
    } else if (req.user.role === 'Worker') {
      filter.workerId = req.user.id;
      console.log('Worker filter:', filter);
    } else if (req.user.role === 'Owner') {
      // Owner can see all appointments for their salon(s)
      // Support multi-salon system
      const { getOwnerSalon } = require('../utils/getOwnerSalon');
      const salonData = await getOwnerSalon(req.user.id);
      console.log('Owner salon data:', salonData);
      if (salonData && salonData.salonId) {
        filter.salonId = salonData.salonId;
        console.log('Owner filter:', filter);
      } else {
        // No salon yet - return empty array
        console.log('Owner has no salon, returning empty array');
        return res.json({
          success: true,
          count: 0,
          data: []
        });
      }
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (salonId && req.user.role === 'Owner') filter.salonId = salonId;
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.dateTime = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(filter)
      .populate({ path: 'clientId', select: 'name email phone avatar', strictPopulate: false })
      .populate({ path: 'workerId', select: 'name email phone avatar', strictPopulate: false })
      .populate('serviceId', 'name duration price category')
      .populate('salonId', 'name address phone')
      .sort({ dateTime: -1 });

    console.log('Found appointments:', appointments.length, 'with filter:', filter);

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
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'clientId', select: 'name email phone', strictPopulate: false })
      .populate({ path: 'workerId', select: 'name email phone', strictPopulate: false })
      .populate('serviceId', 'name duration price category')
      .populate('salonId', 'name address phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization (handle anonymous bookings)
    const isAuthorized = 
      (appointment.clientId && appointment.clientId._id.toString() === req.user.id) ||
      (appointment.workerId && appointment.workerId._id.toString() === req.user.id) ||
      (req.user.role === 'Owner' && await Salon.findOne({ _id: appointment.salonId, ownerId: req.user.id }));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this appointment'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment status
 * @route   PUT /api/appointments/:id/status
 * @access  Private
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed: confirmed, completed, cancelled'
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Authorization check (handle anonymous bookings)
    const salon = await Salon.findById(appointment.salonId);
    const isOwner = salon.ownerId.toString() === req.user.id;
    const isWorker = appointment.workerId && appointment.workerId.toString() === req.user.id;
    const isClient = appointment.clientId && appointment.clientId.toString() === req.user.id;

    // Only owner, worker, or client can update status
    if (!isOwner && !isWorker && !isClient) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this appointment'
      });
    }

    // Clients can only cancel their own appointments
    if (isClient && !isOwner && !isWorker && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Clients can only cancel appointments'
      });
    }

    const oldStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    await appointment.populate([
      { path: 'clientId', select: 'name email phone role', strictPopulate: false },
      { path: 'workerId', select: 'name email phone role', strictPopulate: false },
      { path: 'serviceId', select: 'name duration price category' },
      { path: 'salonId', select: 'name address phone' }
    ]);

    // Send WhatsApp notification to client if status changed to confirmed, cancelled, or completed
    if (['confirmed', 'cancelled', 'completed'].includes(status.toLowerCase()) && appointment.clientId && appointment.clientId.phone) {
      try {
        const notificationService = require('../services/notificationService');
        await notificationService.sendAppointmentStatusUpdate(appointment);
      } catch (error) {
        console.error('[AppointmentController] Failed to send WhatsApp status update:', error);
        // Don't fail status update if WhatsApp fails
      }
    }

    // Log history for status changes
    const { logUserHistory } = require('../utils/userHistoryLogger');
    
    if (status === 'completed') {
      // Log for client
      if (appointment.clientId) {
        await logUserHistory({
          userId: appointment.clientId._id,
          userRole: 'Client',
          action: 'appointment_completed',
          description: `Completed appointment at ${appointment.salonId?.name || 'salon'}`,
          relatedEntity: {
            type: 'Appointment',
            id: appointment._id,
            name: appointment.serviceId?.name || 'Service'
          },
          metadata: { salonId: appointment.salonId?._id, workerId: appointment.workerId?._id },
          req
        });
      }
      
      // Log for worker
      if (appointment.workerId) {
        await logUserHistory({
          userId: appointment.workerId._id,
          userRole: 'Worker',
          action: 'appointment_completed',
          description: `Completed appointment with ${appointment.clientId?.name || 'client'}`,
          relatedEntity: {
            type: 'Appointment',
            id: appointment._id,
            name: appointment.serviceId?.name || 'Service'
          },
          metadata: { clientId: appointment.clientId?._id, salonId: appointment.salonId?._id },
          req
        });
      }
    } else if (status === 'cancelled') {
      // Determine who cancelled
      if (isClient && appointment.clientId) {
        await logUserHistory({
          userId: appointment.clientId._id,
          userRole: 'Client',
          action: 'appointment_cancelled_by_client',
          description: `Cancelled appointment at ${appointment.salonId?.name || 'salon'}`,
          relatedEntity: {
            type: 'Appointment',
            id: appointment._id,
            name: appointment.serviceId?.name || 'Service'
          },
          metadata: { salonId: appointment.salonId?._id, workerId: appointment.workerId?._id },
          req
        });
      } else if (isWorker && appointment.workerId) {
        await logUserHistory({
          userId: appointment.workerId._id,
          userRole: 'Worker',
          action: 'appointment_cancelled_by_worker',
          description: `Cancelled appointment with ${appointment.clientId?.name || 'client'}`,
          relatedEntity: {
            type: 'Appointment',
            id: appointment._id,
            name: appointment.serviceId?.name || 'Service'
          },
          metadata: { clientId: appointment.clientId?._id, salonId: appointment.salonId?._id },
          req
        });
      }
    }

    // TODO: Trigger notification about status change

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots
 * @route   GET /api/appointments/available-slots
 * @access  Public
 */
const getAvailableTimeSlots = async (req, res, next) => {
  try {
    const { workerId, serviceId, date } = req.query;

    if (!workerId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        message: 'workerId, serviceId, and date are required'
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

    // Verify worker exists
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get salon working hours
    const salon = await Salon.findById(worker.salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const requestedDate = new Date(date);
    const slots = await getAvailableSlots(
      workerId,
      requestedDate,
      service.duration,
      salon.workingHours
    );

    res.json({
      success: true,
      data: {
        date: requestedDate,
        serviceDuration: service.duration,
        availableSlots: slots
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create anonymous appointment (no account required)
 * @route   POST /api/appointments/anonymous
 * @access  Public
 */
const createAnonymousAppointment = async (req, res, next) => {
  try {
    const { salonId, serviceId, services, dateTime, clientName, clientPhone, notes } = req.body;

    // Validate required fields
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    if (!clientName || !clientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Client name and phone are required'
      });
    }

    // Validate that at least one service is provided
    if (!serviceId && (!services || !Array.isArray(services) || services.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Either serviceId or services array is required'
      });
    }

    // Validate date is in the future
    if (!isDateInFuture(dateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Verify salon exists
    const salon = await Salon.findById(salonId);
    if (!salon || !salon.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or inactive'
      });
    }

    // Support multiple services or single service
    let servicesToBook = [];
    if (services && Array.isArray(services) && services.length > 0) {
      servicesToBook = services;
    } else if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service || !service.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Service not found or inactive'
        });
      }
      servicesToBook = [{
        serviceId: service._id,
        name: service.name,
        price: service.price,
        duration: service.duration
      }];
    }

    // Verify all services exist and are active and belong to the salon
    const serviceIds = servicesToBook.map(s => s.serviceId);
    const verifiedServices = await Service.find({ _id: { $in: serviceIds }, isActive: true, salonId: salonId });
    
    if (verifiedServices.length !== serviceIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more services not found, inactive, or do not belong to this salon'
      });
    }

    // Calculate total duration and price
    const totalDuration = servicesToBook.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPrice = servicesToBook.reduce((sum, s) => sum + (s.price || 0), 0);

    // Create anonymous appointment (no worker assigned yet - owner will assign)
    const appointment = await Appointment.create({
      salonId: salonId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: servicesToBook[0].serviceId, // Keep for backward compatibility
      services: servicesToBook,
      dateTime,
      notes: notes || '',
      servicePriceAtBooking: totalPrice,
      serviceDurationAtBooking: totalDuration,
      status: 'Pending',
      isAnonymous: true,
      workerId: null // Will be assigned by owner
    });

    console.log('Anonymous appointment created:', {
      id: appointment._id,
      salonId: appointment.salonId,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      dateTime: appointment.dateTime,
      status: appointment.status
    });

    // Populate appointment details
    await appointment.populate([
      { path: 'serviceId', select: 'name duration price category' },
      { path: 'salonId', select: 'name address phone ownerId' }
    ]);

    // Create notification for owner
    const serviceNames = servicesToBook.map(s => s.name).join(', ');
    
    if (salon && salon.ownerId) {
      await createNotification({
        userId: salon.ownerId,
        salonId: salonId,
        type: 'new_appointment',
        title: 'New Anonymous Booking Request',
        message: `${clientName} (${clientPhone}) booked ${serviceNames} - Awaiting your approval and worker assignment`,
        relatedAppointment: appointment._id,
        priority: 'high',
        data: {
          clientName: clientName,
          clientPhone: clientPhone,
          serviceName: serviceNames,
          dateTime: appointment.dateTime,
          isAnonymous: true
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. The salon owner will review and confirm your appointment.',
      data: { appointment }
    });
  } catch (error) {
    console.error('Error creating anonymous appointment:', error);
    next(error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAvailableTimeSlots,
  createAnonymousAppointment
};

