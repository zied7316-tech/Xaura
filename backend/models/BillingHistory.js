const mongoose = require('mongoose');

const billingHistorySchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'TND', // Tunisian Dinar
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String, // 'cash', 'bank_transfer', 'ccp', 'd17', 'flouci', 'card'
      enum: ['cash', 'bank_transfer', 'ccp', 'd17', 'flouci', 'card', 'cheque', 'other'],
      default: 'cash',
    },
    stripePaymentIntentId: {
      type: String,
      required: false, // Optional - only for Stripe payments
    },
    stripeInvoiceId: {
      type: String,
      required: false, // Optional - only for Stripe payments
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: {
      type: String,
    },
    billingPeriod: {
      start: Date,
      end: Date,
    },
    paidAt: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    retryAttempts: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    receiptUrl: {
      type: String,
    },
    receiptNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
billingHistorySchema.index({ salon: 1, createdAt: -1 });
billingHistorySchema.index({ subscription: 1, createdAt: -1 });
billingHistorySchema.index({ status: 1, createdAt: -1 });
billingHistorySchema.index({ nextBillingDate: 1 });
billingHistorySchema.index({ transactionId: 1 });

// Virtual for formatted amount
billingHistorySchema.virtual('formattedAmount').get(function () {
  return `$${this.amount.toFixed(2)}`;
});

// Method to check if payment can be retried
billingHistorySchema.methods.canRetry = function () {
  return this.status === 'failed' && this.retryAttempts < 3;
};

// Set toJSON to include virtuals
billingHistorySchema.set('toJSON', { virtuals: true });
billingHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BillingHistory', billingHistorySchema);

