const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: false, // Optional - only for Stripe
    },
    stripePaymentMethodId: {
      type: String,
      required: false, // Optional - only for Stripe
    },
    type: {
      type: String,
      enum: ['cash', 'bank_transfer', 'ccp', 'd17', 'flouci', 'card', 'cheque', 'other'],
      default: 'cash',
    },
    // Card details (for cards)
    brand: {
      type: String, // 'visa', 'mastercard', 'amex', etc.
    },
    last4: {
      type: String,
    },
    expiryMonth: {
      type: Number,
    },
    expiryYear: {
      type: Number,
    },
    // Bank account details (for bank transfers)
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    accountLast4: {
      type: String,
    },
    rib: {
      type: String, // Relevé d'Identité Bancaire (Tunisia)
    },
    // CCP details (Tunisia postal account)
    ccpNumber: {
      type: String,
    },
    // D17/Flouci details (Tunisia mobile payment)
    phoneNumber: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentMethodSchema.index({ salon: 1, isDefault: 1 });
paymentMethodSchema.index({ stripeCustomerId: 1 });
paymentMethodSchema.index({ stripePaymentMethodId: 1 });

// Ensure only one default payment method per salon
paymentMethodSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default from other payment methods for this salon
    await this.constructor.updateMany(
      { salon: this.salon, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for display name
paymentMethodSchema.virtual('displayName').get(function () {
  if (this.type === 'card') {
    return `${this.brand} •••• ${this.last4}`;
  } else if (this.type === 'bank_account') {
    return `${this.bankName || 'Bank'} •••• ${this.accountLast4}`;
  }
  return this.type;
});

// Method to check if expired (for cards)
paymentMethodSchema.methods.isExpired = function () {
  if (this.type !== 'card') return false;
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (this.expiryYear < currentYear) return true;
  if (this.expiryYear === currentYear && this.expiryMonth < currentMonth) return true;
  
  return false;
};

// Set toJSON to include virtuals
paymentMethodSchema.set('toJSON', { virtuals: true });
paymentMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

