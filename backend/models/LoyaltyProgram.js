const mongoose = require('mongoose');

const loyaltyProgramSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    unique: true
  },
  // Program Settings
  isEnabled: {
    type: Boolean,
    default: true
  },
  // Points Rules
  pointsPerDollar: {
    type: Number,
    default: 1, // 1 point per $1 spent
    min: 0
  },
  bonusPointsFirstVisit: {
    type: Number,
    default: 50
  },
  bonusPointsBirthday: {
    type: Number,
    default: 100
  },
  bonusPointsReferral: {
    type: Number,
    default: 200
  },
  // Membership Tiers
  tiers: {
    bronze: {
      name: {
        type: String,
        default: 'Bronze'
      },
      minPoints: {
        type: Number,
        default: 0
      },
      benefits: [{
        type: String
      }],
      discountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      }
    },
    silver: {
      name: {
        type: String,
        default: 'Silver'
      },
      minPoints: {
        type: Number,
        default: 500
      },
      benefits: [{
        type: String
      }],
      discountPercentage: {
        type: Number,
        default: 5,
        min: 0,
        max: 100
      }
    },
    gold: {
      name: {
        type: String,
        default: 'Gold'
      },
      minPoints: {
        type: Number,
        default: 1000
      },
      benefits: [{
        type: String
      }],
      discountPercentage: {
        type: Number,
        default: 10,
        min: 0,
        max: 100
      }
    },
    platinum: {
      name: {
        type: String,
        default: 'Platinum'
      },
      minPoints: {
        type: Number,
        default: 2000
      },
      benefits: [{
        type: String
      }],
      discountPercentage: {
        type: Number,
        default: 15,
        min: 0,
        max: 100
      }
    }
  },
  // Rewards Catalog
  rewards: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Point Expiry
  pointsExpireDays: {
    type: Number,
    default: 365, // Points expire after 1 year
    min: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoyaltyProgram', loyaltyProgramSchema);




