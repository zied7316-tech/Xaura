const mongoose = require('mongoose');

const gpsTrackingLogSchema = new mongoose.Schema({
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  distanceFromSalon: {
    type: Number, // in meters
    required: true
  },
  isAtSalon: {
    type: Boolean,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
gpsTrackingLogSchema.index({ workerId: 1, date: 1 });
gpsTrackingLogSchema.index({ workerId: 1, timestamp: 1 });
gpsTrackingLogSchema.index({ salonId: 1, date: 1 });
gpsTrackingLogSchema.index({ workerId: 1, isAtSalon: 1, timestamp: 1 });

module.exports = mongoose.model('GPSTrackingLog', gpsTrackingLogSchema);

