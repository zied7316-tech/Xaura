const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // One review per appointment
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  // Ratings (1-5 stars)
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  qualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  punctualityRating: {
    type: Number,
    min: 1,
    max: 5
  },
  friendlinessRating: {
    type: Number,
    min: 1,
    max: 5
  },
  // Review Content
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Feedback
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  // Status
  isApproved: {
    type: Boolean,
    default: true // Auto-approve, or set false for moderation
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Response from salon/worker
  response: {
    text: {
      type: String,
      trim: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ workerId: 1, isApproved: 1, isPublic: 1 });
reviewSchema.index({ salonId: 1, createdAt: -1 });
reviewSchema.index({ clientId: 1, createdAt: -1 });

// Calculate worker's average rating (static method)
reviewSchema.statics.getWorkerAverageRating = async function(workerId) {
  const result = await this.aggregate([
    {
      $match: { workerId: mongoose.Types.ObjectId(workerId), isApproved: true }
    },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$overallRating' },
        averageQuality: { $avg: '$qualityRating' },
        averagePunctuality: { $avg: '$punctualityRating' },
        averageFriendliness: { $avg: '$friendlinessRating' },
        totalReviews: { $sum: 1 },
        recommendCount: {
          $sum: { $cond: ['$wouldRecommend', 1, 0] }
        },
        uniqueClients: { $addToSet: '$clientId' }
      }
    },
    {
      $project: {
        averageOverall: 1,
        averageQuality: 1,
        averagePunctuality: 1,
        averageFriendliness: 1,
        totalReviews: 1,
        recommendCount: 1,
        uniqueClientCount: { $size: '$uniqueClients' }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageOverall: 0,
      averageQuality: 0,
      averagePunctuality: 0,
      averageFriendliness: 0,
      totalReviews: 0,
      recommendPercentage: 0,
      uniqueClientCount: 0
    };
  }

  const data = result[0];
  return {
    averageOverall: Math.round(data.averageOverall * 10) / 10,
    averageQuality: Math.round(data.averageQuality * 10) / 10,
    averagePunctuality: Math.round(data.averagePunctuality * 10) / 10,
    averageFriendliness: Math.round(data.averageFriendliness * 10) / 10,
    totalReviews: data.totalReviews,
    recommendPercentage: Math.round((data.recommendCount / data.totalReviews) * 100),
    uniqueClientCount: data.uniqueClientCount || 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);




