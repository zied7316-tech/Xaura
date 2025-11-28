const mongoose = require('mongoose');

const productHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  salonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Salon',
    required: true,
    index: true
  },
  // Who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['Owner', 'Worker'],
    required: true
  },
  // Action type
  actionType: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'restock', 'use', 'sell'],
    required: true,
    index: true
  },
  // Quantity changes
  quantityBefore: {
    type: Number,
    default: 0
  },
  quantityAfter: {
    type: Number,
    default: 0
  },
  quantityChange: {
    type: Number,
    required: true
  },
  // For sales
  unitPrice: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'other', 'online', 'wallet'],
    default: null
  },
  // Reference to ProductSale if it's a sale
  productSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductSale',
    default: null
  },
  // Optional: Link to appointment if product used/sold during service
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  // Additional details
  description: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  // Metadata for tracking changes
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
productHistorySchema.index({ productId: 1, createdAt: -1 });
productHistorySchema.index({ salonId: 1, createdAt: -1 });
productHistorySchema.index({ userId: 1, createdAt: -1 });
productHistorySchema.index({ actionType: 1, createdAt: -1 });
productHistorySchema.index({ productId: 1, actionType: 1, createdAt: -1 });

module.exports = mongoose.model('ProductHistory', productHistorySchema);

