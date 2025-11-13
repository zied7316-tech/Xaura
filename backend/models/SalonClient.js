const mongoose = require('mongoose');

const salonClientSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // How they joined
  joinMethod: {
    type: String,
    enum: ['qr_code', 'manual', 'booking', 'referral'],
    default: 'qr_code'
  },
  // First visit date
  joinedAt: {
    type: Date,
    default: Date.now
  },
  // Total appointments at this salon
  totalAppointments: {
    type: Number,
    default: 0
  },
  // Total spent at this salon
  totalSpent: {
    type: Number,
    default: 0
  },
  // Last visit
  lastVisit: {
    type: Date,
    default: null
  },
  // Client status
  status: {
    type: String,
    enum: ['active', 'inactive', 'vip'],
    default: 'active'
  },
  // Notes from salon about client
  notes: {
    type: String,
    default: ''
  },
  // Favorite services
  favoriteServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }]
}, {
  timestamps: true
});

// Unique constraint: One client can only be added once per salon
salonClientSchema.index({ salonId: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('SalonClient', salonClientSchema);

