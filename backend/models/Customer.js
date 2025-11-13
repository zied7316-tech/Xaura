const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  // Customer preferences
  preferredWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  preferredServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // Visit tracking
  totalVisits: {
    type: Number,
    default: 0
  },
  lastVisit: {
    type: Date,
    default: null
  },
  firstVisit: {
    type: Date,
    default: Date.now
  },
  // Financial tracking
  totalSpent: {
    type: Number,
    default: 0
  },
  averageSpending: {
    type: Number,
    default: 0
  },
  // CRM Notes
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Allergies or special requirements
  specialRequirements: {
    type: String,
    default: ''
  },
  allergies: {
    type: String,
    default: ''
  },
  // Birthday for marketing
  birthday: {
    type: Date,
    default: null
  },
  // Customer status
  status: {
    type: String,
    enum: ['active', 'inactive', 'vip', 'blocked'],
    default: 'active'
  },
  // Loyalty points (future use)
  loyaltyPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ salonId: 1, userId: 1 }, { unique: true });
customerSchema.index({ salonId: 1, status: 1 });
customerSchema.index({ salonId: 1, totalSpent: -1 });
customerSchema.index({ lastVisit: -1 });

module.exports = mongoose.model('Customer', customerSchema);

