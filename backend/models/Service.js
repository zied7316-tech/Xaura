const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  duration: {
    type: Number, // Duration in minutes
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    enum: ['Haircut', 'Coloring', 'Styling', 'Manicure', 'Pedicure', 'Facial', 'Massage', 'Waxing', 'Other'],
    default: 'Other'
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  // Service Assignment
  assignmentType: {
    type: String,
    enum: ['general', 'specific_workers', 'owner_only'],
    default: 'general'
  },
  // Specific workers who can provide this service (if assignmentType = 'specific_workers')
  assignedWorkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Service Image
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster salon service lookups
serviceSchema.index({ salonId: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);

