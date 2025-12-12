const mongoose = require('mongoose');

const appointmentAdjustmentSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    index: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  adjustedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Owner who made the adjustment
  },
  adjustmentType: {
    type: String,
    enum: ['edit', 'void'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  // Track what changed
  changes: {
    serviceId: {
      old: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
      new: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null }
    },
    price: {
      old: { type: Number, default: null },
      new: { type: Number, default: null }
    },
    paymentStatus: {
      old: { type: String, default: null },
      new: { type: String, default: null }
    },
    paymentMethod: {
      old: { type: String, default: null },
      new: { type: String, default: null }
    }
  },
  // Financial impact
  financialImpact: {
    oldWorkerEarning: { type: Number, default: 0 },
    newWorkerEarning: { type: Number, default: 0 },
    earningDifference: { type: Number, default: 0 }, // Can be negative
    oldPaymentAmount: { type: Number, default: 0 },
    newPaymentAmount: { type: Number, default: 0 },
    paymentDifference: { type: Number, default: 0 }
  },
  // Original earning record (before adjustment)
  originalEarningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerEarning',
    default: null
  },
  // New earning record (after adjustment, if not voided)
  newEarningId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerEarning',
    default: null
  },
  // Original payment record (before adjustment)
  originalPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  // New payment record (after adjustment, if not voided)
  newPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null
  },
  // Notification sent to worker
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
appointmentAdjustmentSchema.index({ workerId: 1, createdAt: -1 });
appointmentAdjustmentSchema.index({ appointmentId: 1 });
appointmentAdjustmentSchema.index({ salonId: 1, createdAt: -1 });

module.exports = mongoose.model('AppointmentAdjustment', appointmentAdjustmentSchema);

