const mongoose = require('mongoose');

const recurringAppointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  // Recurrence Settings
  frequency: {
    type: String,
    enum: ['weekly', 'biweekly', 'monthly'],
    required: true
  },
  dayOfWeek: {
    type: Number, // 0 = Sunday, 6 = Saturday
    min: 0,
    max: 6
  },
  dayOfMonth: {
    type: Number, // For monthly: 1-31
    min: 1,
    max: 31
  },
  timeSlot: {
    type: String,
    required: true // e.g., "10:00"
  },
  // Start and End
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date, // Optional, null = indefinite
    default: null
  },
  // Generated Appointments
  generatedAppointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  pausedUntil: {
    type: Date,
    default: null
  },
  // Notes
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
recurringAppointmentSchema.index({ clientId: 1, isActive: 1 });
recurringAppointmentSchema.index({ workerId: 1, isActive: 1 });
recurringAppointmentSchema.index({ salonId: 1, isActive: 1 });

module.exports = mongoose.model('RecurringAppointment', recurringAppointmentSchema);




