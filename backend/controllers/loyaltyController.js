const LoyaltyProgram = require('../models/LoyaltyProgram');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const CustomerProfile = require('../models/CustomerProfile');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * @desc    Get loyalty program settings
 * @route   GET /api/loyalty/program
 * @access  Private (Owner)
 */
const getLoyaltyProgram = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    let program = await LoyaltyProgram.findOne({ salonId: salonData.salonId });

    if (!program) {
      // Create default program
      program = await LoyaltyProgram.create({
        salonId: salonData.salonId,
        tiers: {
          bronze: {
            name: 'Bronze',
            minPoints: 0,
            benefits: ['Earn 1 point per 1 د.ت', 'Birthday bonus'],
            discountPercentage: 0
          },
          silver: {
            name: 'Silver',
            minPoints: 500,
            benefits: ['5% discount', 'Priority booking', 'Birthday bonus'],
            discountPercentage: 5
          },
          gold: {
            name: 'Gold',
            minPoints: 1000,
            benefits: ['10% discount', 'Priority booking', 'Exclusive services'],
            discountPercentage: 10
          },
          platinum: {
            name: 'Platinum',
            minPoints: 2000,
            benefits: ['15% discount', 'VIP treatment', 'Free upgrades', 'Birthday bonus'],
            discountPercentage: 15
          }
        },
        rewards: [
          { name: '5.000 د.ت Off Next Visit', description: 'Get 5.000 د.ت off your next service', pointsCost: 100, discountAmount: 5, isActive: true },
          { name: '10.000 د.ت Off Next Visit', description: 'Get 10.000 د.ت off your next service', pointsCost: 200, discountAmount: 10, isActive: true },
          { name: '20.000 د.ت Off Next Visit', description: 'Get 20.000 د.ت off your next service', pointsCost: 400, discountAmount: 20, isActive: true },
          { name: 'Free Basic Haircut', description: 'Redeem for one free basic haircut', pointsCost: 500, discountAmount: 30, isActive: true },
        ]
      });
    }

    res.json({
      success: true,
      data: program
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update loyalty program
 * @route   PUT /api/loyalty/program
 * @access  Private (Owner)
 */
const updateLoyaltyProgram = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    let program = await LoyaltyProgram.findOne({ salonId: salonData.salonId });

    if (!program) {
      program = await LoyaltyProgram.create({
        salonId: salonData.salonId,
        ...req.body
      });
    } else {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          program[key] = req.body[key];
        }
      });
      await program.save();
    }

    res.json({
      success: true,
      message: 'Loyalty program updated successfully',
      data: program
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get client's loyalty points and tier
 * @route   GET /api/loyalty/my-points
 * @access  Private (Client)
 */
const getMyLoyaltyPoints = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { salonId } = req.query;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    // Get customer profile
    const profile = await CustomerProfile.findOne({ userId: clientId, salonId });
    
    const points = profile?.loyaltyPoints || 0;
    const tier = profile?.membershipTier || 'Bronze';

    // Get loyalty program
    const program = await LoyaltyProgram.findOne({ salonId });

    // Get transaction history
    const transactions = await LoyaltyTransaction.find({ userId: clientId, salonId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        points,
        tier,
        program,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Award points to client (called after service completion)
 * @route   POST /api/loyalty/award-points
 * @access  Private (System/Internal)
 */
const awardPoints = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('clientId')
      .populate('salonId');

    if (!appointment) return;

    const program = await LoyaltyProgram.findOne({ salonId: appointment.salonId._id });
    if (!program || !program.isEnabled) return;

    // Calculate points based on amount paid
    const amountPaid = appointment.paidAmount || appointment.servicePriceAtBooking;
    const pointsEarned = Math.floor(amountPaid * program.pointsPerDollar);

    // Get or create customer profile
    let profile = await CustomerProfile.findOne({
      userId: appointment.clientId._id,
      salonId: appointment.salonId._id
    });

    if (!profile) {
      profile = await CustomerProfile.create({
        userId: appointment.clientId._id,
        salonId: appointment.salonId._id,
        loyaltyPoints: 0
      });
    }

    // Check if first visit bonus
    const isFirstVisit = profile.stats?.totalVisits === 1;
    const firstVisitBonus = isFirstVisit ? program.bonusPointsFirstVisit : 0;

    const totalPoints = pointsEarned + firstVisitBonus;
    const previousBalance = profile.loyaltyPoints || 0;

    // Update profile points
    profile.loyaltyPoints = previousBalance + totalPoints;

    // Check and update tier
    if (profile.loyaltyPoints >= program.tiers.platinum.minPoints) {
      profile.membershipTier = 'Platinum';
    } else if (profile.loyaltyPoints >= program.tiers.gold.minPoints) {
      profile.membershipTier = 'Gold';
    } else if (profile.loyaltyPoints >= program.tiers.silver.minPoints) {
      profile.membershipTier = 'Silver';
    } else {
      profile.membershipTier = 'Bronze';
    }

    await profile.save();

    // Record transaction
    await LoyaltyTransaction.create({
      userId: appointment.clientId._id,
      salonId: appointment.salonId._id,
      type: 'earned',
      points: totalPoints,
      description: `Earned ${pointsEarned} points from service${firstVisitBonus ? ` + ${firstVisitBonus} first visit bonus` : ''}`,
      relatedAppointment: appointmentId,
      balanceAfter: profile.loyaltyPoints
    });

    return {
      success: true,
      pointsEarned: totalPoints,
      newBalance: profile.loyaltyPoints,
      tier: profile.membershipTier
    };
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false };
  }
};

/**
 * @desc    Redeem reward
 * @route   POST /api/loyalty/redeem
 * @access  Private (Client)
 */
const redeemReward = async (req, res, next) => {
  try {
    const clientId = req.user.id;
    const { salonId, rewardId } = req.body;

    const program = await LoyaltyProgram.findOne({ salonId });
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty program not found'
      });
    }

    const reward = program.rewards.id(rewardId);
    if (!reward || !reward.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found or inactive'
      });
    }

    // Get customer profile
    let profile = await CustomerProfile.findOne({ userId: clientId, salonId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Check if enough points
    if (profile.loyaltyPoints < reward.pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Deduct points
    const previousBalance = profile.loyaltyPoints;
    profile.loyaltyPoints -= reward.pointsCost;
    await profile.save();

    // Record transaction
    await LoyaltyTransaction.create({
      userId: clientId,
      salonId,
      type: 'redeemed',
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      relatedReward: reward.name,
      balanceAfter: profile.loyaltyPoints
    });

    res.json({
      success: true,
      message: 'Reward redeemed successfully!',
      data: {
        reward,
        pointsDeducted: reward.pointsCost,
        newBalance: profile.loyaltyPoints
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLoyaltyProgram,
  updateLoyaltyProgram,
  getMyLoyaltyPoints,
  awardPoints,
  redeemReward
};




