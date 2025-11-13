const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true // Format: "09:00"
  },
  end: {
    type: String,
    required: true // Format: "17:00"
  }
});

const workerAvailabilitySchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  // Weekly schedule
  weeklySchedule: {
    monday: {
      isAvailable: { type: Boolean, default: true },
      slots: [timeSlotSchema]
    },
    tuesday: {
      isAvailable: { type: Boolean, default: true },
      slots: [timeSlotSchema]
    },
    wednesday: {
      isAvailable: { type: Boolean, default: true },
      slots: [timeSlotSchema]
    },
    thursday: {
      isAvailable: { type: Boolean, default: true },
      slots: [timeSlotSchema]
    },
    friday: {
      isAvailable: { type: Boolean, default: true },
      slots: [timeSlotSchema]
    },
    saturday: {
      isAvailable: { type: Boolean, default: false },
      slots: [timeSlotSchema]
    },
    sunday: {
      isAvailable: { type: Boolean, default: false },
      slots: [timeSlotSchema]
    }
  },
  // Specific date overrides (for holidays, time off, etc.)
  dateOverrides: [{
    date: Date,
    isAvailable: Boolean,
    slots: [timeSlotSchema],
    reason: String
  }],
  // Default working hours (applied to all available days if no specific slots)
  defaultHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '17:00'
    }
  }
}, {
  timestamps: true
});

// Index for faster lookups
workerAvailabilitySchema.index({ workerId: 1 });
workerAvailabilitySchema.index({ salonId: 1 });

module.exports = mongoose.model('WorkerAvailability', workerAvailabilitySchema);

