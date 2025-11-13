const Appointment = require('../models/Appointment');

/**
 * Check if a time slot is available for a worker
 * @param {String} workerId - Worker ID
 * @param {Date} dateTime - Requested appointment date/time
 * @param {Number} duration - Service duration in minutes
 * @param {String} excludeAppointmentId - Optional: Exclude this appointment (for updates)
 * @returns {Boolean} - True if available, false if conflict
 */
const isSlotAvailable = async (workerId, dateTime, duration, excludeAppointmentId = null) => {
  const requestedStart = new Date(dateTime);
  const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

  // Find all confirmed/pending appointments for this worker on the same day
  const startOfDay = new Date(requestedStart);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedStart);
  endOfDay.setHours(23, 59, 59, 999);

  const query = {
    workerId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] }
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const existingAppointments = await Appointment.find(query)
    .select('dateTime serviceDurationAtBooking');

  // Check for time conflicts
  for (const appointment of existingAppointments) {
    const existingStart = new Date(appointment.dateTime);
    const existingEnd = new Date(existingStart.getTime() + appointment.serviceDurationAtBooking * 60000);

    // Check if times overlap
    if (
      (requestedStart >= existingStart && requestedStart < existingEnd) ||
      (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
      (requestedStart <= existingStart && requestedEnd >= existingEnd)
    ) {
      return false; // Conflict found
    }
  }

  return true; // No conflicts
};

/**
 * Get available time slots for a worker on a specific date
 * @param {String} workerId - Worker ID
 * @param {Date} date - The date to check
 * @param {Number} serviceDuration - Service duration in minutes
 * @param {Object} workingHours - Salon working hours
 * @returns {Array} - Array of available time slots
 */
const getAvailableSlots = async (workerId, date, serviceDuration, workingHours) => {
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
  const daySchedule = workingHours[dayName];

  // Check if salon is closed on this day
  if (!daySchedule || daySchedule.isClosed || !daySchedule.open || !daySchedule.close) {
    return [];
  }

  // Parse working hours
  const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMinute] = daySchedule.close.split(':').map(Number);

  const openTime = new Date(date);
  openTime.setHours(openHour, openMinute, 0, 0);

  const closeTime = new Date(date);
  closeTime.setHours(closeHour, closeMinute, 0, 0);

  // Generate time slots (every 30 minutes by default)
  const slots = [];
  const slotInterval = 30; // minutes
  let currentTime = new Date(openTime);

  while (currentTime < closeTime) {
    const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

    // Check if this slot fits within working hours
    if (slotEnd <= closeTime) {
      const isAvailable = await isSlotAvailable(workerId, currentTime, serviceDuration);
      
      if (isAvailable) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: slotEnd,
          available: true
        });
      }
    }

    currentTime = new Date(currentTime.getTime() + slotInterval * 60000);
  }

  return slots;
};

/**
 * Validate appointment date is in the future
 * @param {Date} dateTime - Appointment date/time
 * @returns {Boolean}
 */
const isDateInFuture = (dateTime) => {
  const now = new Date();
  const appointmentDate = new Date(dateTime);
  return appointmentDate > now;
};

module.exports = {
  isSlotAvailable,
  getAvailableSlots,
  isDateInFuture
};

