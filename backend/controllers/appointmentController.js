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

    const { workerId, serviceId, dateTime, notes } = req.body;

    console.log('Creating appointment:', {
      workerId,
      serviceId,
      dateTime,
      clientId: req.user.id
    });

    // Validate date is in the future
    if (!isDateInFuture(dateTime)) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Verify service exists
    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or inactive'
      });
    }

    // Verify worker exists and is active
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'Worker' || !worker.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or inactive'
      });
    }

    // Check if worker has salonId
    if (!worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker is not assigned to a salon'
      });
    }

    // Check if service has salonId
    if (!service.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Service is not assigned to a salon'
      });
    }

    // Verify worker belongs to the same salon as the service
    const workerSalonId = worker.salonId.toString();
    const serviceSalonId = service.salonId.toString();
    
    if (workerSalonId !== serviceSalonId) {
      console.error('Salon mismatch:', {
        workerId: worker._id,
        workerSalonId,
        serviceId: service._id,
        serviceSalonId
      });
      return res.status(400).json({
        success: false,
        message: 'Worker does not belong to the salon offering this service'
      });
    }

    // Check if time slot is available
    const available = await isSlotAvailable(workerId, dateTime, service.duration);
    if (!available) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is not available. Please choose another time.'
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      clientId: req.user.id,
      workerId,
      serviceId,
      salonId: service.salonId,
      dateTime,
      notes: notes || '',
      servicePriceAtBooking: service.price,
      serviceDurationAtBooking: service.duration,
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
      { path: 'clientId', select: 'name email phone' },
      { path: 'workerId', select: 'name email phone' },
      { path: 'serviceId', select: 'name duration price category' },
      { path: 'salonId', select: 'name address phone ownerId' }
    ]);

    // Create notifications for worker and owner
    const salon = await Salon.findById(service.salonId);
    
    // Notify worker
    await createNotification({
      userId: workerId,
      salonId: service.salonId,
      type: 'new_appointment',
      title: 'New Appointment Request',
      message: `${appointment.clientId.name} wants to book ${service.name}`,
      relatedAppointment: appointment._id,
      relatedUser: req.user.id,
      priority: 'high',
      data: {
        clientName: appointment.clientId.name,
        serviceName: service.name,
        dateTime: appointment.dateTime
      }
    });

    // Notify owner
    if (salon && salon.ownerId) {
      await createNotification({
        userId: salon.ownerId,
        salonId: service.salonId,
        type: 'new_appointment',
        title: 'New Appointment Request',
        message: `${appointment.clientId.name} booked ${service.name} with ${worker.name}`,
        relatedAppointment: appointment._id,
        priority: 'normal',
        data: {
          clientName: appointment.clientId.name,
          workerName: worker.name,
          serviceName: service.name,
          dateTime: appointment.dateTime
        }
      });
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

    // Filter based on user role
    if (req.user.role === 'Client') {
      filter.clientId = req.user.id;
    } else if (req.user.role === 'Worker') {
      filter.workerId = req.user.id;
    } else if (req.user.role === 'Owner') {
      // Owner can see all appointments for their salon
      const salon = await Salon.findOne({ ownerId: req.user.id });
      if (salon) {
        filter.salonId = salon._id;
      } else {
        // No salon yet - return empty array
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
      .populate('clientId', 'name email phone avatar')
      .populate('workerId', 'name email phone avatar')
      .populate('serviceId', 'name duration price category')
      .populate('salonId', 'name address phone')
      .sort({ dateTime: -1 });

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
      .populate('clientId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate('serviceId', 'name duration price category')
      .populate('salonId', 'name address phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      appointment.clientId._id.toString() === req.user.id ||
      appointment.workerId._id.toString() === req.user.id ||
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

    // Authorization check
    const salon = await Salon.findById(appointment.salonId);
    const isOwner = salon.ownerId.toString() === req.user.id;
    const isWorker = appointment.workerId.toString() === req.user.id;
    const isClient = appointment.clientId.toString() === req.user.id;

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

    appointment.status = status;
    await appointment.save();

    await appointment.populate([
      { path: 'clientId', select: 'name email phone' },
      { path: 'workerId', select: 'name email phone' },
      { path: 'serviceId', select: 'name duration price category' },
      { path: 'salonId', select: 'name address phone' }
    ]);

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

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAvailableTimeSlots
};

