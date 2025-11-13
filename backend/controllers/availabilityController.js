const WorkerAvailability = require('../models/WorkerAvailability');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');

/**
 * @desc    Get or create worker's availability
 * @route   GET /api/availability/my-schedule
 * @access  Private (Worker)
 */
const getMyAvailability = async (req, res, next) => {
  try {
    const availability = await WorkerAvailability.findOne({ workerId: req.user.id });
    
    // No automatic creation - worker must set their schedule manually
    if (!availability) {
      return res.json({
        success: true,
        data: null,
        message: 'No availability schedule set. Please configure your working hours.'
      });
    }

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker's availability
 * @route   PUT /api/availability/my-schedule
 * @access  Private (Worker)
 */
const updateMyAvailability = async (req, res, next) => {
  try {
    const { weeklySchedule, defaultHours, dateOverrides } = req.body;

    if (!weeklySchedule) {
      return res.status(400).json({
        success: false,
        message: 'Weekly schedule is required'
      });
    }

    let availability = await WorkerAvailability.findOne({ workerId: req.user.id });

    if (!availability) {
      // Create new availability schedule
      availability = await WorkerAvailability.create({
        workerId: req.user.id,
        salonId: req.user.salonId,
        weeklySchedule,
        defaultHours: defaultHours || { start: '09:00', end: '17:00' },
        dateOverrides: dateOverrides || []
      });
    } else {
      // Update existing schedule
      if (weeklySchedule) availability.weeklySchedule = weeklySchedule;
      if (defaultHours) availability.defaultHours = defaultHours;
      if (dateOverrides !== undefined) availability.dateOverrides = dateOverrides;
      await availability.save();
    }

    res.json({
      success: true,
      message: 'Availability schedule saved successfully',
      data: availability
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available workers for a salon on a specific date
 * @route   GET /api/availability/salon/:salonId/workers
 * @access  Public
 */
const getAvailableWorkers = async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { date, serviceId } = req.query;

    // Get all active workers for the salon
    // Don't filter by currentStatus here - show all workers
    // They can book for future even if worker is currently offline
    const workers = await User.find({
      salonId,
      role: 'Worker',
      isActive: true
    }).select('name email avatar paymentModel currentStatus');

    // If service specified, filter by workers who can provide it
    let availableWorkers = workers;
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service && service.assignmentType === 'specific_workers') {
        availableWorkers = workers.filter(w => 
          service.assignedWorkers.some(id => id.toString() === w._id.toString())
        );
      } else if (service && service.assignmentType === 'owner_only') {
        availableWorkers = [];
      }
    }

    // Get availability for each worker
    const workersWithAvailability = await Promise.all(
      availableWorkers.map(async (worker) => {
        const availability = await WorkerAvailability.findOne({ workerId: worker._id });
        
        let isAvailableOnDate = false;
        let timeSlots = [];

        if (date) {
          const requestedDate = new Date(date);
          const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          
          if (availability) {
            // Check for date override first
            const override = availability.dateOverrides.find(o => 
              new Date(o.date).toDateString() === requestedDate.toDateString()
            );

            if (override) {
              isAvailableOnDate = override.isAvailable;
              timeSlots = override.slots || [];
            } else {
              // Check weekly schedule
              const daySchedule = availability.weeklySchedule[dayOfWeek];
              isAvailableOnDate = daySchedule?.isAvailable || false;
              timeSlots = daySchedule?.slots || [];
              
              // If no specific slots, use default hours
              if (isAvailableOnDate && timeSlots.length === 0 && availability.defaultHours) {
                timeSlots = [{
                  start: availability.defaultHours.start,
                  end: availability.defaultHours.end
                }];
              }
            }
          } else {
            // If worker hasn't set availability, use default 9-5
            isAvailableOnDate = !['saturday', 'sunday'].includes(dayOfWeek);
            timeSlots = isAvailableOnDate ? [{ start: '09:00', end: '17:00' }] : [];
          }
        }

        return {
          ...worker.toObject(),
          isAvailableOnDate,
          timeSlots
        };
      })
    );

    res.json({
      success: true,
      data: workersWithAvailability.filter(w => !date || w.isAvailableOnDate)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available time slots for a worker on a specific date
 * @route   GET /api/availability/worker/:workerId/slots
 * @access  Public
 */
const getWorkerTimeSlots = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { date, serviceId } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get worker availability
    const availability = await WorkerAvailability.findOne({ workerId });
    
    let timeSlots = [];
    
    if (availability) {
      // Check for date override
      const override = availability.dateOverrides.find(o => 
        new Date(o.date).toDateString() === requestedDate.toDateString()
      );

      if (override) {
        if (!override.isAvailable) {
          return res.json({ success: true, data: [] });
        }
        timeSlots = override.slots;
      } else {
        const daySchedule = availability.weeklySchedule[dayOfWeek];
        if (!daySchedule?.isAvailable) {
          return res.json({ success: true, data: [] });
        }
        timeSlots = daySchedule.slots;
        
        if (timeSlots.length === 0 && availability.defaultHours) {
          timeSlots = [{
            start: availability.defaultHours.start,
            end: availability.defaultHours.end
          }];
        }
      }
    } else {
      // Default availability if worker hasn't set schedule
      // Monday-Friday 9AM-5PM
      if (!['saturday', 'sunday'].includes(dayOfWeek)) {
        timeSlots = [{ start: '09:00', end: '17:00' }];
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    // Get service duration
    let serviceDuration = 60; // default 60 minutes
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        serviceDuration = service.duration;
      }
    }

    // Generate available slots
    const availableSlots = [];
    const slotInterval = 60; // 60-minute intervals (hourly slots)
    const bufferMinutes = 10; // 10-minute buffer for late arrivals/early completions

    for (const slot of timeSlots) {
      let currentTime = slot.start;
      const endTime = slot.end;

      while (currentTime < endTime) {
        // Calculate slot with buffer
        const slotStartWithBuffer = addMinutes(currentTime, -bufferMinutes);
        const slotEndWithBuffer = addMinutes(currentTime, serviceDuration + bufferMinutes);
        
        // Check if slot fits within working hours (including buffer)
        if (slotEndWithBuffer <= addMinutes(endTime, bufferMinutes)) {
          // Check if worker has existing appointment at this time (with buffer)
          const hasConflict = await checkAppointmentConflict(
            workerId,
            date,
            slotStartWithBuffer,
            slotEndWithBuffer
          );

          // ALWAYS push the slot, but mark as unavailable if there's a conflict
          availableSlots.push({
            start: currentTime, // Show exact hour to client
            end: addMinutes(currentTime, serviceDuration),
            available: !hasConflict // false if booked, true if available
          });
        }

        currentTime = addMinutes(currentTime, slotInterval);
      }
    }

    res.json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to add minutes to time string
function addMinutes(time, minutes) {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Helper function to check appointment conflicts
async function checkAppointmentConflict(workerId, date, startTime, endTime) {
  const requestedDate = new Date(date);
  const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

  const [startHours, startMins] = startTime.split(':').map(Number);
  const [endHours, endMins] = endTime.split(':').map(Number);

  const appointments = await Appointment.find({
    workerId,
    dateTime: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
  });

  for (const apt of appointments) {
    const aptTime = new Date(apt.dateTime);
    const aptHours = aptTime.getHours();
    const aptMins = aptTime.getMinutes();
    const aptDuration = apt.duration || 60;
    
    const aptStartMinutes = aptHours * 60 + aptMins;
    const aptEndMinutes = aptStartMinutes + aptDuration;
    const requestStartMinutes = startHours * 60 + startMins;
    const requestEndMinutes = endHours * 60 + endMins;

    // Check for overlap
    if (
      (requestStartMinutes >= aptStartMinutes && requestStartMinutes < aptEndMinutes) ||
      (requestEndMinutes > aptStartMinutes && requestEndMinutes <= aptEndMinutes) ||
      (requestStartMinutes <= aptStartMinutes && requestEndMinutes >= aptEndMinutes)
    ) {
      return true; // Conflict found
    }
  }

  return false; // No conflict
}

module.exports = {
  getMyAvailability,
  updateMyAvailability,
  getAvailableWorkers,
  getWorkerTimeSlots
};

