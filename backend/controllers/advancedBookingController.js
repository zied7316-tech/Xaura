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
      services, // Array of services (for multi-service bookings)
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeSlot,
      startDate,
      endDate,
      notes,
      numberOfPeople = 1,
      peopleServices = [] // Array of { personIndex, services: [{ serviceId, name, price, duration }] }
    } = req.body;

    const clientId = req.user.id;

    // Determine if this is a multi-person booking
    const isMultiPerson = numberOfPeople > 1 && peopleServices.length > 0;

    // For single person, use serviceId or services array
    let servicesToBook = [];
    if (isMultiPerson) {
      // Validate peopleServices
      if (peopleServices.length !== numberOfPeople) {
        return res.status(400).json({
          success: false,
          message: `Number of people (${numberOfPeople}) doesn't match peopleServices array length (${peopleServices.length})`
        });
      }
      // Use services from peopleServices
      servicesToBook = peopleServices[0].services || [];
    } else {
      // Single person - use services array if provided, otherwise use serviceId
      if (services && Array.isArray(services) && services.length > 0) {
        servicesToBook = services;
      } else if (serviceId) {
        // Fallback to single serviceId
        const service = await Service.findById(serviceId);
        if (!service) {
          return res.status(404).json({
            success: false,
            message: 'Service not found'
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
          message: 'Either serviceId or services array is required'
        });
      }
    }

    // Verify first service and worker
    const firstServiceId = servicesToBook[0].serviceId;
    const service = await Service.findById(firstServiceId);
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
    const recurringData = {
      clientId,
      workerId,
      serviceId: firstServiceId, // Keep for backward compatibility
      salonId: service.salonId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeSlot,
      startDate,
      endDate,
      notes: notes || '',
      numberOfPeople: isMultiPerson ? numberOfPeople : 1,
      peopleServices: isMultiPerson ? peopleServices : []
    };

    const recurring = await RecurringAppointment.create(recurringData);

    // Generate first 4 appointments
    const appointments = [];
    const appointmentDates = generateRecurringDates(recurring, 4);

    for (const date of appointmentDates) {
      if (isMultiPerson) {
        // Create one appointment per person at the same time
        for (let personIdx = 0; personIdx < numberOfPeople; personIdx++) {
          const person = peopleServices[personIdx];
          if (!person || !person.services || person.services.length === 0) continue;

          // Calculate total price and duration for this person's services
          const totalPrice = person.services.reduce((sum, s) => sum + (s.price || 0), 0);
          const totalDuration = person.services.reduce((sum, s) => sum + (s.duration || 0), 0);

          const appointment = await Appointment.create({
            clientId,
            workerId,
            serviceId: person.services[0].serviceId, // Primary service for backward compatibility
            services: person.services.map(s => ({
              serviceId: s.serviceId,
              name: s.name,
              price: s.price,
              duration: s.duration
            })),
            salonId: service.salonId,
            dateTime: date,
            servicePriceAtBooking: totalPrice,
            serviceDurationAtBooking: totalDuration,
            status: 'Pending',
            notes: `Recurring appointment (${frequency}) - Person ${personIdx + 1} of ${numberOfPeople}`,
            skipAvailabilityCheck: personIdx > 0 // Skip check for subsequent appointments
          });
          appointments.push(appointment._id);
        }
      } else {
        // Single person - create one appointment
        const totalPrice = servicesToBook.reduce((sum, s) => sum + (s.price || 0), 0);
        const totalDuration = servicesToBook.reduce((sum, s) => sum + (s.duration || 0), 0);

        const appointment = await Appointment.create({
          clientId,
          workerId,
          serviceId: firstServiceId,
          services: servicesToBook.map(s => ({
            serviceId: s.serviceId,
            name: s.name,
            price: s.price,
            duration: s.duration
          })),
          salonId: service.salonId,
          dateTime: date,
          servicePriceAtBooking: totalPrice,
          serviceDurationAtBooking: totalDuration,
          status: 'Pending',
          notes: `Recurring appointment (${frequency})`
        });
        appointments.push(appointment._id);
      }
    }

    recurring.generatedAppointments = appointments;
    await recurring.save();

    await recurring.populate('serviceId', 'name price');
    await recurring.populate('workerId', 'name');

    res.status(201).json({
      success: true,
      message: `Recurring appointment${isMultiPerson ? `s for ${numberOfPeople} people` : ''} created successfully`,
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




