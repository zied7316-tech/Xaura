const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

/**
 * @desc    Create review for completed appointment
 * @route   POST /api/reviews
 * @access  Private (Client)
 */
const createReview = async (req, res, next) => {
  try {
    const {
      appointmentId,
      overallRating,
      qualityRating,
      punctualityRating,
      friendlinessRating,
      comment,
      wouldRecommend
    } = req.body;

    const clientId = req.user.id;

    // Verify appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId)
      .populate('workerId', 'name')
      .populate('serviceId', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.clientId.toString() !== clientId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (appointment.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed appointments'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this appointment'
      });
    }

    // Create review
    const review = await Review.create({
      appointmentId,
      clientId,
      workerId: appointment.workerId._id,
      salonId: appointment.salonId,
      serviceId: appointment.serviceId._id,
      overallRating,
      qualityRating,
      punctualityRating,
      friendlinessRating,
      comment: comment || '',
      wouldRecommend: wouldRecommend !== false
    });

    // Notify worker
    await createNotification({
      userId: appointment.workerId._id,
      salonId: appointment.salonId,
      type: 'review_received',
      title: 'New Review Received!',
      message: `You got a ${overallRating}-star review!`,
      priority: overallRating >= 4 ? 'normal' : 'high',
      data: {
        rating: overallRating,
        clientName: req.user.name
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for worker
 * @route   GET /api/reviews/worker/:workerId
 * @access  Public
 */
const getWorkerReviews = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    const reviews = await Review.find({
      workerId,
      isApproved: true,
      isPublic: true
    })
      .populate('clientId', 'name avatar')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    // Get average ratings
    const stats = await Review.getWorkerAverageRating(workerId);

    res.json({
      success: true,
      data: reviews,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get reviews for salon
 * @route   GET /api/reviews/salon/:salonId
 * @access  Public
 */
const getSalonReviews = async (req, res, next) => {
  try {
    const { salonId } = req.params;

    const reviews = await Review.find({
      salonId,
      isApproved: true,
      isPublic: true
    })
      .populate('clientId', 'name avatar')
      .populate('workerId', 'name')
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    // Calculate salon average
    const result = await Review.aggregate([
      {
        $match: {
          salonId: mongoose.Types.ObjectId(salonId),
          isApproved: true
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const stats = result.length > 0 ? {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    } : { averageRating: 0, totalReviews: 0 };

    res.json({
      success: true,
      data: reviews,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private (Client)
 */
const getMyReviews = async (req, res, next) => {
  try {
    const clientId = req.user.id;

    const reviews = await Review.find({ clientId })
      .populate('workerId', 'name')
      .populate('serviceId', 'name')
      .populate('appointmentId', 'dateTime')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if appointment can be reviewed
 * @route   GET /api/reviews/can-review/:appointmentId
 * @access  Private (Client)
 */
const canReviewAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const clientId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment || appointment.clientId.toString() !== clientId) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'Appointment not found'
      });
    }

    if (appointment.status !== 'Completed') {
      return res.json({
        success: true,
        canReview: false,
        reason: 'Appointment not completed yet'
      });
    }

    const existingReview = await Review.findOne({ appointmentId });
    
    res.json({
      success: true,
      canReview: !existingReview,
      reason: existingReview ? 'Already reviewed' : null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
  getSalonReviews,
  getMyReviews,
  canReviewAppointment
};




