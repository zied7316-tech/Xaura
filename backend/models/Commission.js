const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Worker is required']
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment is required']
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment is required']
  },
  serviceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  commissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    year: { type: Number, required: true },
    month: { type: Number, required: true }, // 1-12
    week: { type: Number, required: true } // 1-52
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paidAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for commission reports
commissionSchema.index({ workerId: 1, status: 1, createdAt: -1 });
commissionSchema.index({ salonId: 1, status: 1 });
commissionSchema.index({ 'period.year': 1, 'period.month': 1 });

module.exports = mongoose.model('Commission', commissionSchema);

