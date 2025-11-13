const Salon = require('../models/Salon');
const User = require('../models/User');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
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

    const salon = await Salon.create({
      ...req.body,
      ownerId: req.user.id,
      qrCode: qrCodeString
    });

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
 * @desc    Update salon
 * @route   PUT /api/salons/:id
 * @access  Private (Owner only)
 */
const updateSalon = async (req, res, next) => {
  try {
    // checkSalonOwnership middleware already verified ownership
    const { qrCode, ownerId, ...updateData } = req.body;

    // Don't allow updating QR code or owner
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Worker email is required'
      });
    }

    // Find the worker user
    const worker = await User.findOne({ email, role: 'Worker' });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found or user is not a worker'
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
  updateSalon,
  addWorker,
  getSalonServices,
  getSalonSchedule,
  getQRCodeImage
};

