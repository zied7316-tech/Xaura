const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Salon name is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  logo: {
    type: String,
    default: ''
  },
  qrCode: {
    type: String,
    unique: true,
    required: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  // Operating Mode
  operatingMode: {
    type: String,
    enum: ['solo', 'team'],
    default: 'solo',
    required: true
  },
  workingHours: {
    monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, isClosed: { type: Boolean, default: true } }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Worker Availability Tracking Settings
  workerTracking: {
    method: {
      type: String,
      enum: ['manual', 'wifi', 'gps'],
      default: 'manual'
    },
    // WiFi Tracking Settings
    wifi: {
      ssid: {
        type: String,
        default: '',
        trim: true
      },
      enabled: {
        type: Boolean,
        default: false
      }
    },
    // GPS Tracking Settings
    gps: {
      latitude: {
        type: Number,
        default: null
      },
      longitude: {
        type: Number,
        default: null
      },
      radius: {
        type: Number,
        default: 100, // meters
        min: 10,
        max: 1000
      },
      enabled: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true
});

// Index for QR code lookups
salonSchema.index({ qrCode: 1 });

module.exports = mongoose.model('Salon', salonSchema);

