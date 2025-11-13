const mongoose = require('mongoose');

const workerEarningSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  // Earning details
  servicePrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Track if price was adjusted (for walk-ins or service changes)
  originalPrice: {
    type: Number,
    default: null
  },
  finalPrice: {
    type: Number,
    default: null
  },
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  workerEarning: {
    type: Number,
    required: true,
    min: 0
  },
  // Payment model type used
  paymentModelType: {
    type: String,
    enum: ['fixed_salary', 'percentage_commission', 'hybrid'],
    required: true
  },
  // Status
  isPaid: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkerInvoice',
    default: null
  },
  // Date of the service
  serviceDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
workerEarningSchema.index({ workerId: 1, isPaid: 1 });
workerEarningSchema.index({ salonId: 1, serviceDate: -1 });
workerEarningSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('WorkerEarning', workerEarningSchema);

