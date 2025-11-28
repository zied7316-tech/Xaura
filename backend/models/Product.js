const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: [true, 'Salon is required']
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['Hair Care', 'Styling Products', 'Tools', 'Supplies', 'Cleaning', 'Other'],
    default: 'Other'
  },
  sku: {
    type: String,
    trim: true,
    default: ''
  },
  // Stock Management
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    enum: ['pieces', 'bottles', 'boxes', 'liters', 'kg', 'grams', 'other'],
    default: 'pieces'
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  // Product Type
  productType: {
    type: String,
    enum: ['for_sale', 'for_use'],
    default: 'for_use'
  },
  // Pricing
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  // Worker Commission (for products for sale)
  workerCommission: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fixedAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  // Supplier Info
  supplier: {
    name: {
      type: String,
      trim: true,
      default: ''
    },
    contact: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    }
  },
  // Usage Tracking
  usedInServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Notes
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  // Last Restock
  lastRestockDate: {
    type: Date,
    default: null
  },
  lastRestockQuantity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.lowStockThreshold;
});

// Indexes
productSchema.index({ salonId: 1, name: 1 });
productSchema.index({ salonId: 1, category: 1 });
productSchema.index({ salonId: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);




