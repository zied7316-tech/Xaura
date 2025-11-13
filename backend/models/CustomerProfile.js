const mongoose = require('mongoose');

const customerProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true
  },
  // Client Information
  birthday: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  // Preferences
  preferences: {
    favoriteServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    favoriteWorkers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    preferredTimeSlots: [String], // e.g., ['morning', 'afternoon', 'evening']
    communicationPreference: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'email'
    }
  },
  // Notes & History
  notes: [{
    content: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['General', 'Allergies', 'Preferences', 'Behavior', 'Other'],
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isImportant: {
      type: Boolean,
      default: false
    }
  }],
  // Tags
  tags: [String], // e.g., ['VIP', 'Regular', 'High Spender', 'Loyal']
  // Marketing
  marketingConsent: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    promotions: {
      type: Boolean,
      default: true
    }
  },
  // Loyalty
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  membershipTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  // Statistics (computed but stored for performance)
  stats: {
    totalVisits: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageSpent: {
      type: Number,
      default: 0
    },
    lastVisit: {
      type: Date,
      default: null
    },
    firstVisit: {
      type: Date,
      default: null
    }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
customerProfileSchema.index({ userId: 1, salonId: 1 });
customerProfileSchema.index({ salonId: 1, isActive: 1 });
customerProfileSchema.index({ birthday: 1 });

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);




