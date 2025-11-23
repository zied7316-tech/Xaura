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
  }]
}, {
  timestamps: true
});

// Critical indexes for performance - MUST be added for walk-in client creation
userSchema.index({ phone: 1, role: 1 }); // For walk-in client lookup - CRITICAL!
userSchema.index({ email: 1 }); // Ensure email index exists (already unique, but explicit index helps)
userSchema.index({ salonId: 1, role: 1 }); // For worker queries
userSchema.index({ role: 1 }); // General role-based queries

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip password hashing for walk-in clients (saves 100-500ms per creation)
  // Walk-in clients don't need to log in, so password hashing is unnecessary overhead
  if (this.isWalkIn && this.isModified('password')) {
    this.password = 'WALKIN_NO_PASSWORD_' + Date.now();
    return next();
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  
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

module.exports = mongoose.model('User', userSchema);

