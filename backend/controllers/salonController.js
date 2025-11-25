const Salon = require('../models/Salon');
const User = require('../models/User');
const SalonOwnership = require('../models/SalonOwnership');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { generateUniqueSlug } = require('../utils/slugGenerator');

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
 * @desc    Create new salon
 * @route   POST /api/salons
 * @access  Private (Owner only)
 */
const createSalon = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user already has a salon (one salon per owner for MVP)
    const existingSalon = await Salon.findOne({ ownerId: req.user.id });
    if (existingSalon) {
      return res.status(400).json({
        success: false,
        message: 'You already have a salon. Only one salon per owner is allowed.'
      });
    }

    // Generate unique QR code
    const qrCodeString = await generateUniqueQRCode();
    
    // Generate unique slug from salon name
    const slug = await generateUniqueSlug(req.body.name, Salon);

    const salon = await Salon.create({
      ...req.body,
      ownerId: req.user.id,
      qrCode: qrCodeString,
      slug: slug
    });

    // Check if this is user's first salon (check both ownership and direct ownerId)
    const existingOwnerships = await SalonOwnership.countDocuments({
      user: req.user.id,
      isActive: true,
    });
    const existingDirectSalons = await Salon.countDocuments({
      ownerId: req.user.id,
      _id: { $ne: salon._id }
    });
    const isFirstSalon = existingOwnerships === 0 && existingDirectSalons === 0;

    // Create SalonOwnership record so it appears in "My Salons"
    await SalonOwnership.create({
      user: req.user.id,
      salon: salon._id,
      role: 'owner',
      isPrimary: isFirstSalon,
      isActive: true,
      permissions: {
        canManageServices: true,
        canManageWorkers: true,
        canManageFinances: true,
        canManageSettings: true,
        canViewReports: true,
      }
    });

    // Create trial subscription automatically
    const Subscription = require('../models/Subscription');
    const { createTrialSubscription } = require('../config/subscriptionPlans');
    await Subscription.create(createTrialSubscription(salon._id, req.user.id));

    res.status(201).json({
      success: true,
      message: 'Salon created successfully',
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon by ID
 * @route   GET /api/salons/:id
 * @access  Public
 */
const getSalonById = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id)
      .populate('ownerId', 'name email phone');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.json({
      success: true,
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon by QR code
 * @route   GET /api/salons/qr/:qrCode
 * @access  Public
 */
const getSalonByQRCode = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ qrCode: req.params.qrCode })
      .populate('ownerId', 'name email phone');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found with this QR code'
      });
    }

    res.json({
      success: true,
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon by slug
 * @route   GET /api/salons/slug/:slug
 * @access  Public
 */
const getSalonBySlug = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ slug: req.params.slug })
      .populate('ownerId', 'name email phone');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found with this slug'
      });
    }

    res.json({
      success: true,
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update salon
 * @route   PUT /api/salons/:id
 * @access  Private (Owner only)
 */
const updateSalon = async (req, res, next) => {
  try {
    // checkSalonOwnership middleware already verified ownership
    const { qrCode, ownerId, logo, ...updateData } = req.body;

    // Don't allow updating QR code, owner, or logo (logo should be updated via upload endpoint)
    // Get current salon first to preserve logo
    const currentSalon = await Salon.findById(req.params.id);
    if (!currentSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // If salon name changed, regenerate slug
    if (updateData.name && updateData.name !== currentSalon.name) {
      updateData.slug = await generateUniqueSlug(updateData.name, Salon, req.params.id);
    }
    
    // Preserve logo field - never overwrite it in this endpoint
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      { ...updateData, logo: currentSalon.logo }, // Explicitly preserve logo
      { new: true, runValidators: true }
    );

    console.log('Salon updated. Logo preserved:', salon.logo);

    res.json({
      success: true,
      message: 'Salon updated successfully',
      data: { salon }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add worker to salon
 * @route   POST /api/salons/:id/workers
 * @access  Private (Owner only)
 */
const addWorker = async (req, res, next) => {
  try {
    const { userID, email } = req.body;

    if (!userID) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Worker email is required'
      });
    }

    // Validate userID format
    if (!/^\d{4}$/.test(userID)) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID must be exactly 4 digits'
      });
    }

    // Find the worker user by both userID and email
    const worker = await User.findOne({ userID, email, role: 'Worker' });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found. Please verify the Worker ID and email match a registered worker account.'
      });
    }

    // Check if worker already assigned to a salon
    if (worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker is already assigned to a salon'
      });
    }

    // Assign worker to salon
    worker.salonId = req.params.id;
    await worker.save();

    // Log history for owner and worker
    const { logUserHistory } = require('../utils/userHistoryLogger');
    const salon = await Salon.findById(req.params.id).populate('ownerId', 'name role');
    
    if (salon && salon.ownerId) {
      await logUserHistory({
        userId: salon.ownerId._id,
        userRole: 'Owner',
        action: 'worker_added',
        description: `Added worker ${worker.name} to salon ${salon.name}`,
        relatedEntity: {
          type: 'Worker',
          id: worker._id,
          name: worker.name
        },
        metadata: { salonId: salon._id, salonName: salon.name },
        req
      });
    }

    await logUserHistory({
      userId: worker._id,
      userRole: 'Worker',
      action: 'joined_salon',
      description: `Joined salon ${salon?.name || 'Unknown'}`,
      relatedEntity: {
        type: 'Salon',
        id: req.params.id,
        name: salon?.name
      },
      metadata: { ownerId: salon?.ownerId?._id },
      req
    });

    res.json({
      success: true,
      message: 'Worker added to salon successfully',
      data: { worker }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon services
 * @route   GET /api/salons/:id/services
 * @access  Public
 */
const getSalonServices = async (req, res, next) => {
  try {
    const Service = require('../models/Service');
    const services = await Service.find({ 
      salonId: req.params.id,
      isActive: true 
    }).sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon schedule/availability
 * @route   GET /api/salons/:id/schedule
 * @access  Public
 */
const getSalonSchedule = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get all workers for this salon
    const workers = await User.find({ 
      salonId: req.params.id, 
      role: 'Worker',
      isActive: true 
    }).select('name email phone');

    res.json({
      success: true,
      data: {
        workingHours: salon.workingHours,
        workers
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get QR code image
 * @route   GET /api/salons/:id/qr-image
 * @access  Public
 */
const getQRCodeImage = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id);

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(salon.qrCode);

    res.json({
      success: true,
      data: { 
        qrCode: salon.qrCode,
        qrCodeImage: qrCodeDataURL
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSalon,
  getSalonById,
  getSalonByQRCode,
  getSalonBySlug,
  updateSalon,
  addWorker,
  getSalonServices,
  getSalonSchedule,
  getQRCodeImage
};

