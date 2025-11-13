const mongoose = require('mongoose');

const groupBookingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  // Services in this group booking
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending'
    }
  }],
  // Booking Details
  bookingDate: {
    type: Date,
    required: true
  },
  totalDuration: {
    type: Number, // Total minutes for all services
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  // Overall Status (all services must be same status)
  overallStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
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
groupBookingSchema.index({ clientId: 1, bookingDate: 1 });
groupBookingSchema.index({ salonId: 1, bookingDate: 1 });

module.exports = mongoose.model('GroupBooking', groupBookingSchema);




