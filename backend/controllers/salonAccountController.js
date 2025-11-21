const Salon = require('../models/Salon');
const User = require('../models/User');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

/**
 * Generate unique QR code string
 */
const generateUniqueQRCode = async () => {
  let qrCode;
  let exists = true;

  while (exists) {
    qrCode = `SALON_${uuidv4()}`;
    const salon = await Salon.findOne({ qrCode });
    exists = !!salon;
  }

  return qrCode;
};

/**
 * @desc    Create Salon Account (Salon-First Registration)
 * @route   POST /api/salon-account/register
 * @access  Public
 * 
 * This is the main registration for a new salon business.
 * It creates the salon first, then the owner/admin account.
 */
const createSalonAccount = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      // Salon Details (Primary)
      salonName,
      salonDescription,
      salonPhone,
      salonEmail,
      salonAddress,
      workingHours,
      operatingMode,
      
      // Owner/Admin Credentials (Secondary)
      ownerName,
      ownerEmail,
      ownerPassword,
      ownerPhone
    } = req.body;

    // Check if owner email already exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Step 1: Create Owner/Admin account first
    const owner = await User.create({
      email: ownerEmail,
      password: ownerPassword,
      role: 'Owner',
      name: ownerName,
      phone: ownerPhone,
      isActive: true
    });

    // Step 2: Generate unique QR code for the salon
    const qrCodeString = await generateUniqueQRCode();

    // Step 3: Create Salon Account (Primary Business Entity)
    const salon = await Salon.create({
      name: salonName,
      description: salonDescription || '',
      phone: salonPhone,
      email: salonEmail || '',
      address: salonAddress || {},
      workingHours: workingHours || {
        monday: { open: '09:00', close: '18:00', isClosed: false },
        tuesday: { open: '09:00', close: '18:00', isClosed: false },
        wednesday: { open: '09:00', close: '18:00', isClosed: false },
        thursday: { open: '09:00', close: '18:00', isClosed: false },
        friday: { open: '09:00', close: '20:00', isClosed: false },
        saturday: { open: '10:00', close: '17:00', isClosed: false },
        sunday: { open: '00:00', close: '00:00', isClosed: true }
      },
      operatingMode: operatingMode || 'solo',
      qrCode: qrCodeString,
      ownerId: owner._id,
      isActive: true
    });

    // Step 4: Link owner to salon (in solo mode, owner is also a worker)
    if (operatingMode === 'solo') {
      owner.salonId = salon._id;
      owner.paymentModel = {
        type: 'percentage_commission',
        commissionPercentage: 100 // Owner gets 100% in solo mode
      };
      await owner.save();
    }

    // Step 5: Create trial subscription automatically
    const Subscription = require('../models/Subscription');
    const { TRIAL_CONFIG } = require('../config/subscriptionPlans');
    const now = new Date();
    await Subscription.create({
      salonId: salon._id,
      ownerId: owner._id,
      plan: null, // No plan during trial
      status: 'trial',
      monthlyFee: 0,
      price: 0,
      trial: {
        startDate: now,
        endDate: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000),
        confirmationDay: new Date(now.getTime() + TRIAL_CONFIG.confirmationDay * 24 * 60 * 60 * 1000)
      },
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000)
    });

    // Generate authentication token
    const token = generateToken(owner._id);

    // Return complete salon account
    res.status(201).json({
      success: true,
      message: 'Salon account created successfully!',
      data: {
        salon: {
          id: salon._id,
          name: salon.name,
          qrCode: salon.qrCode,
          operatingMode: salon.operatingMode
        },
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          role: owner.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete salon account info
 * @route   GET /api/salon-account
 * @access  Private (Owner)
 */
const getSalonAccount = async (req, res, next) => {
  try {
    // Find salon by owner - support both direct ownerId and SalonOwnership
    let salon = await Salon.findOne({ ownerId: req.user.id })
      .populate('ownerId', 'name email phone');

    // If not found via direct ownerId, try SalonOwnership
    if (!salon) {
      const SalonOwnership = require('../models/SalonOwnership');
      const ownership = await SalonOwnership.findOne({ 
        user: req.user.id, 
        isPrimary: true, 
        isActive: true 
      }).populate('salon').populate('user', 'name email phone');
      
      if (ownership && ownership.salon) {
        salon = ownership.salon;
        salon.ownerId = ownership.user;
      }
    }

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon account not found'
      });
    }

    // Log logo to verify it's being returned
    console.log('getSalonAccount - Salon logo:', salon.logo);
    console.log('getSalonAccount - Salon logo type:', typeof salon.logo, 'length:', salon.logo?.length);

    // Ensure logo is not accidentally cleared (if it exists in DB but is empty string, log it)
    if (salon.logo === '' || salon.logo === null || salon.logo === undefined) {
      console.warn('getSalonAccount - WARNING: Salon logo is empty/null/undefined for salon:', salon._id);
    }

    // Get workers count
    const workersCount = await User.countDocuments({
      salonId: salon._id,
      role: 'Worker',
      isActive: true
    });

    // Get services count
    const Service = require('../models/Service');
    const servicesCount = await Service.countDocuments({
      salonId: salon._id,
      isActive: true
    });

    // Get customers count
    const Customer = require('../models/Customer');
    const customersCount = await Customer.countDocuments({
      salonId: salon._id
    });

    res.json({
      success: true,
      data: {
        salon,
        stats: {
          workers: workersCount,
          services: servicesCount,
          customers: customersCount,
          mode: salon.operatingMode
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update salon account operating mode
 * @route   PUT /api/salon-account/mode
 * @access  Private (Owner)
 */
const updateOperatingMode = async (req, res, next) => {
  try {
    const { operatingMode } = req.body;

    if (!['solo', 'team'].includes(operatingMode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operating mode. Must be "solo" or "team"'
      });
    }

    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Update mode
    salon.operatingMode = operatingMode;
    await salon.save();

    // If switching to solo mode, update owner's payment model
    if (operatingMode === 'solo') {
      await User.findByIdAndUpdate(req.user.id, {
        salonId: salon._id,
        'paymentModel.commissionPercentage': 100
      });
    }

    res.json({
      success: true,
      message: `Operating mode changed to ${operatingMode}`,
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSalonAccount,
  getSalonAccount,
  updateOperatingMode
};

