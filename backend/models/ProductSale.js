const mongoose = require('mongoose');

const productSaleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
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
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  // Commission details
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  commissionValue: {
    type: Number,
    required: true,
    min: 0
  },
  workerCommissionAmount: {
    type: Number,
    required: true,
    min: 0
  },
  salonRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  // Payment info
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other', 'online', 'wallet'],
    default: 'cash'
  },
  saleDate: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  // Optional: Link to appointment if product sold during service
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productSaleSchema.index({ workerId: 1, saleDate: -1 });
productSaleSchema.index({ salonId: 1, saleDate: -1 });
productSaleSchema.index({ productId: 1, saleDate: -1 });

module.exports = mongoose.model('ProductSale', productSaleSchema);

