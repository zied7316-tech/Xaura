const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Client not required for walk-in appointments or anonymous bookings
      return !this.isWalkIn && !this.isAnonymous;
    },
    default: null
  },
  // Anonymous client information (for bookings without account)
  clientName: {
    type: String,
    trim: true,
    required: function() {
      return this.isAnonymous && !this.clientId;
    }
  },
  clientPhone: {
    type: String,
    trim: true,
    required: function() {
      return this.isAnonymous && !this.clientId;
    }
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      // Worker not required for anonymous bookings (will be assigned by owner)
      return !this.isAnonymous;
    },
    default: null
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: false // Made optional to support multiple services
  },
  // Support for multiple services
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
  },
    name: String,
    price: Number,
    duration: Number
  }],
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  dateTime: {
    type: Date,
    required: [true, 'Appointment date and time is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Pending'
  },
  // Payment status
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'waiting'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other'],
    default: 'cash'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  // Store service price at booking time (in case price changes later)
  servicePriceAtBooking: {
    type: Number,
    required: true
  },
  // Final price (after adjustments by worker when completing)
  finalPrice: {
    type: Number,
    default: null
  },
  // Store service duration at booking time
  serviceDurationAtBooking: {
    type: Number,
    required: true
  },
  // Flag for walk-in appointments (no prior booking)
  isWalkIn: {
    type: Boolean,
    default: false
  },
  // Flag for anonymous bookings (no client account)
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Tracking timestamps for appointment lifecycle
  acceptedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Track if WhatsApp reminder was sent (1 hour before appointment)
  whatsappReminderSent: {
    type: Boolean,
    default: false
  },
  whatsappReminderSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Indexes for efficient queries
appointmentSchema.index({ dateTime: 1, status: 1 });
appointmentSchema.index({ clientId: 1, status: 1 });
appointmentSchema.index({ workerId: 1, dateTime: 1 });
appointmentSchema.index({ salonId: 1, dateTime: 1 });

// Prevent double booking - same worker at same time (only for non-anonymous bookings with assigned workers)
appointmentSchema.index(
  { workerId: 1, dateTime: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['Pending', 'Confirmed'] },
      workerId: { $ne: null }
    }
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

