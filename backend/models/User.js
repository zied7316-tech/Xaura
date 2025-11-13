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
  avatar: {
    type: String,
    default: ''
  },
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
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
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

