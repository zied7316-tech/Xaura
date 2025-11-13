const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['hair_products', 'nail_products', 'skincare', 'tools', 'equipment', 'supplies', 'other'],
    required: true
  },
  brand: {
    type: String,
    default: '',
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    enum: ['piece', 'bottle', 'kg', 'liter', 'box', 'pack'],
    default: 'piece'
  },
  reorderLevel: {
    type: Number,
    default: 10 // Alert when stock reaches this level
  },
  costPrice: {
    type: Number,
    default: 0,
    min: [0, 'Cost price must be positive']
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Selling price must be positive']
  },
  supplier: {
    name: { type: String, default: '' },
    contact: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  expiryDate: {
    type: Date,
    default: null
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  notes: {
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

// Indexes
inventorySchema.index({ salonId: 1, isActive: 1 });
inventorySchema.index({ salonId: 1, quantity: 1 });
inventorySchema.index({ category: 1 });

// Virtual for low stock alert
inventorySchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderLevel;
});

module.exports = mongoose.model('Inventory', inventorySchema);

