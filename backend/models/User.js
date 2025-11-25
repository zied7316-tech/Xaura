const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Owner', 'Worker', 'Client'],
    default: 'Client',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  birthday: {
    type: Date,
    default: null
  },
  avatar: {
    type: String,
    default: ''
  },
  // Worker-specific information
  bio: {
    type: String,
    default: '',
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    default: '',
    trim: true
  },
  education: {
    type: String,
    default: '',
    trim: true
  },
  certifications: [{
    type: String,
    trim: true
  }],
  // For Workers - reference to their salon
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    default: null
  },
  // Worker Payment Model (for role: Worker)
  paymentModel: {
    type: {
      type: String,
      enum: ['fixed_salary', 'percentage_commission', 'hybrid'],
      default: 'percentage_commission'
    },
    fixedSalary: {
      type: Number,
      default: 0,
      min: 0
    },
    commissionPercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    // For hybrid: base salary + commission
    baseSalary: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Quick status for workers (available, on_break, offline)
  currentStatus: {
    type: String,
    enum: ['available', 'on_break', 'offline'],
    default: 'offline' // Changed: Workers start as offline, must manually set available
  },
  lastStatusChange: {
    type: Date,
    default: Date.now
  },
  // GPS tracking status (for hybrid sticky status system)
  gpsTrackingStatus: {
    confirmedAtSalon: {
      type: Boolean,
      default: false
    },
    lastConfirmedAtSalon: {
      type: Date,
      default: null
    },
    lastKnownLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    lastLocationUpdate: {
      type: Date,
      default: null
    }
  },
  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpire: {
    type: Date,
    default: null
  },
  // Password Reset
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // Push Notification Tokens (for web and mobile)
  pushTokens: [{
    token: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      enum: ['web', 'android', 'ios'],
      default: 'web'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Walk-in client flags
  isWalkIn: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // User ID - 4-digit unique identifier
  userID: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness for non-null values
    minlength: 4,
    maxlength: 4,
    match: [/^\d{4}$/, 'User ID must be exactly 4 digits']
  }
}, {
  timestamps: true
});

// Critical indexes for performance - MUST be added for walk-in client creation and login
userSchema.index({ email: 1 }, { unique: true }); // For login - CRITICAL! (email is unique, but explicit index ensures fast lookups)
userSchema.index({ phone: 1, role: 1 }); // For walk-in client lookup - CRITICAL!
userSchema.index({ salonId: 1, role: 1 }); // For worker queries
userSchema.index({ role: 1 }); // General role-based queries
userSchema.index({ userID: 1 }, { unique: true, sparse: true }); // For userID uniqueness

// Generate unique 4-digit userID
async function generateUniqueUserID() {
  const UserModel = mongoose.model('User');
  let userID;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 4-digit number (1000-9999)
    userID = String(Math.floor(1000 + Math.random() * 9000));
    
    // Check if this userID already exists
    try {
      const existingUser = await UserModel.findOne({ userID }).maxTimeMS(5000);
      if (!existingUser) {
        isUnique = true;
      }
    } catch (error) {
      console.error('[USER] Error checking userID uniqueness:', error.message);
      // Continue to next attempt
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique userID after multiple attempts');
  }

  return userID;
}

// Hash password before saving
userSchema.pre('validate', async function(next) {
  // For walk-in clients, set password BEFORE validation to pass minlength check
  if (this.isWalkIn && this.isNew && !this.password) {
    this.password = 'WALKIN_NO_PASSWORD_' + Date.now();
  }

  // Generate userID for ALL users (new and existing) if not provided
  if (!this.userID) {
    try {
      this.userID = await generateUniqueUserID();
      if (this.isNew) {
        console.log(`[USER] Generated new userID: ${this.userID} for new user: ${this.email}`);
      } else {
        console.log(`[USER] Generated userID for existing user: ${this.userID} (${this.email})`);
      }
    } catch (error) {
      console.error('[USER] Error generating userID:', error.message);
      return next(error);
    }
  }

  next();
});

userSchema.pre('save', async function(next) {
  // Skip password hashing for walk-in clients (saves 100-500ms per creation)
  // Walk-in clients don't need to log in, so password hashing is unnecessary overhead
  // Check for new documents OR modified password
  if (this.isWalkIn && (this.isNew || this.isModified('password'))) {
    // Ensure password is set (should already be set by pre-validate hook)
    if (!this.password || this.password.startsWith('WALKIN_')) {
      this.password = 'WALKIN_NO_PASSWORD_' + Date.now();
    }
    return next(); // Skip hashing for walk-ins
  }
  
  // Skip if password not modified (for existing documents)
  if (!this.isModified('password')) {
    return next();
  }
  
  // Hash password for regular users
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Export the User model and the generateUniqueUserID function
const User = mongoose.model('User', userSchema);
module.exports = User;
module.exports.generateUniqueUserID = generateUniqueUserID;

