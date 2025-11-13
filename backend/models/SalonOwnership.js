const mongoose = require('mongoose');

const salonOwnershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    salon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'admin'],
      default: 'owner',
    },
    permissions: {
      canManageServices: { type: Boolean, default: true },
      canManageWorkers: { type: Boolean, default: true },
      canManageFinances: { type: Boolean, default: true },
      canManageSettings: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
salonOwnershipSchema.index({ user: 1, salon: 1 }, { unique: true });
salonOwnershipSchema.index({ user: 1, isActive: 1 });
salonOwnershipSchema.index({ salon: 1, isActive: 1 });

// Ensure only one primary salon per user
salonOwnershipSchema.pre('save', async function (next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary from other salons for this user
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

module.exports = mongoose.model('SalonOwnership', salonOwnershipSchema);


