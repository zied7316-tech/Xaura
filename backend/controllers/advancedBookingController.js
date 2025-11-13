const RecurringAppointment = require('../models/RecurringAppointment');
const GroupBooking = require('../models/GroupBooking');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * @desc    Create recurring appointment
 * @route   POST /api/advanced-booking/recurring
 * @access  Private (Client)
 */
const createRecurringAppointment = async (req, res, next) => {
  try {
    const {
      workerId,
      serviceId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeSlot,
      startDate,
      endDate,
      notes
    } = req.body;

    const clientId = req.user.id;

    // Verify service and worker
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Create recurring appointment
    const recurring = await RecurringAppointment.create({
      clientId,
      workerId,
      serviceId,
      salonId: service.salonId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeSlot,
      startDate,
      endDate,
      notes: notes || ''
    });

    // Generate first 4 appointments
    const appointments = [];
    const appointmentDates = generateRecurringDates(recurring, 4);

    for (const date of appointmentDates) {
      const appointment = await Appointment.create({
        clientId,
        workerId,
        serviceId,
        salonId: service.salonId,
        dateTime: date,
        servicePriceAtBooking: service.price,
        serviceDurationAtBooking: service.duration,
        status: 'Pending',
        notes: `Recurring appointment (${frequency})`
      });
      appointments.push(appointment._id);
    }

    recurring.generatedAppointments = appointments;
    await recurring.save();

    await recurring.populate('serviceId', 'name price');
    await recurring.populate('workerId', 'name');

    res.status(201).json({
      success: true,
      message: 'Recurring appointment created successfully',
      data: recurring,
      generatedCount: appointments.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client's recurring appointments
 * @route   GET /api/advanced-booking/recurring
 * @access  Private (Client)
 */
const getRecurringAppointments = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const recurring = await RecurringAppointment.find({ clientId, isActive: true })
      .populate('serviceId', 'name price duration')
      .populate('workerId', 'name')
      .populate('salonId', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: recurring
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel recurring appointment
 * @route   DELETE /api/advanced-booking/recurring/:id
 * @access  Private (Client)
 */
const cancelRecurring = async (req, res, next) => {
  try {
    const recurring = await RecurringAppointment.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({
        success: false,
        message: 'Recurring appointment not found'
      });
    }

    if (recurring.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Cancel all future pending appointments
    await Appointment.updateMany(
      {
        _id: { $in: recurring.generatedAppointments },
        status: 'Pending',
        dateTime: { $gte: new Date() }
      },
      { status: 'Cancelled' }
    );

    // Deactivate recurring
    recurring.isActive = false;
    await recurring.save();

    res.json({
      success: true,
      message: 'Recurring appointment cancelled'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create group booking (multiple services)
 * @route   POST /api/advanced-booking/group
 * @access  Private (Client)
 */
const createGroupBooking = async (req, res, next) => {
  try {
    const { services, bookingDate, notes } = req.body;
    const clientId = req.user.id;

    if (!services || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one service is required'
      });
    }

    // Get all services details
    let totalDuration = 0;
    let totalPrice = 0;
    const salonId = null;

    const serviceDetails = await Promise.all(
      services.map(async (item) => {
        const service = await Service.findById(item.serviceId);
        if (!service) throw new Error(`Service ${item.serviceId} not found`);
        
        totalDuration += service.duration;
        totalPrice += service.price;
        
        return {
          service,
          workerId: item.workerId
        };
      })
    );

    const firstSalonId = serviceDetails[0].service.salonId;

    // Create individual appointments
    let currentDateTime = new Date(bookingDate);
    const createdAppointments = [];

    for (let i = 0; i < serviceDetails.length; i++) {
      const { service, workerId } = serviceDetails[i];

      const appointment = await Appointment.create({
        clientId,
        workerId,
        serviceId: service._id,
        salonId: service.salonId,
        dateTime: currentDateTime,
        servicePriceAtBooking: service.price,
        serviceDurationAtBooking: service.duration,
        status: 'Pending',
        notes: notes || 'Part of group booking'
      });

      createdAppointments.push({
        serviceId: service._id,
        workerId,
        appointmentId: appointment._id,
        status: 'Pending'
      });

      // Add duration for next service
      currentDateTime = new Date(currentDateTime.getTime() + service.duration * 60000);
    }

    // Create group booking record
    const groupBooking = await GroupBooking.create({
      clientId,
      salonId: firstSalonId,
      services: createdAppointments,
      bookingDate: new Date(bookingDate),
      totalDuration,
      totalPrice,
      overallStatus: 'Pending',
      notes: notes || ''
    });

    await groupBooking.populate([
      { path: 'services.serviceId', select: 'name price duration' },
      { path: 'services.workerId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Group booking created successfully',
      data: groupBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client's group bookings
 * @route   GET /api/advanced-booking/group
 * @access  Private (Client)
 */
const getGroupBookings = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const groupBookings = await GroupBooking.find({ clientId })
      .populate('services.serviceId', 'name price duration')
      .populate('services.workerId', 'name')
      .populate('salonId', 'name')
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      data: groupBookings
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate recurring dates
function generateRecurringDates(recurring, count = 4) {
  const dates = [];
  let currentDate = new Date(recurring.startDate);

  for (let i = 0; i < count; i++) {
    // Set time
    const [hours, minutes] = recurring.timeSlot.split(':');
    currentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if before end date (if set)
    if (recurring.endDate && currentDate > new Date(recurring.endDate)) {
      break;
    }

    dates.push(new Date(currentDate));

    // Calculate next date based on frequency
    switch (recurring.frequency) {
      case 'weekly':
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'biweekly':
        currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  return dates;
}

module.exports = {
  createRecurringAppointment,
  getRecurringAppointments,
  cancelRecurring,
  createGroupBooking,
  getGroupBookings
};




