const User = require('../models/User');
const Salon = require('../models/Salon');
const Customer = require('../models/Customer');
const SalonClient = require('../models/SalonClient');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

/**
 * @desc    Register client via QR code scan (auto-linked to salon)
 * @route   POST /api/qr-register/:qrCode
 * @access  Public
 */
const registerViaQR = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { qrCode } = req.params;
    const { email, password, name, phone } = req.body;

    // Find salon by QR code
    const salon = await Salon.findOne({ qrCode });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code. Salon not found.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists. Please login instead.'
      });
    }

    // Create new client user
    const user = await User.create({
      email,
      password,
      role: 'Client', // Auto-assign Client role
      name,
      phone
    });

    // Automatically create customer profile linked to this salon
    await Customer.create({
      userId: user._id,
      salonId: salon._id,
      firstVisit: new Date(),
      status: 'active'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You are now connected to ' + salon.name,
      data: {
        user,
        token,
        salon: {
          id: salon._id,
          name: salon.name,
          qrCode: salon.qrCode
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon info from QR code (for registration page)
 * @route   GET /api/qr-info/:qrCode
 * @access  Public
 */
const getSalonInfoForQR = async (req, res, next) => {
  try {
    const { qrCode } = req.params;

    const salon = await Salon.findOne({ qrCode })
      .populate('ownerId', 'name email phone')
      .select('name description address phone email logo workingHours');

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
 * @desc    Join salon via QR code (for existing clients)
 * @route   POST /api/qr/join/:qrCode
 * @access  Private (Client)
 */
const joinSalonViaQR = async (req, res, next) => {
  try {
    const { qrCode } = req.params;

    // Find salon by QR code
    const salon = await Salon.findOne({ qrCode });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR code. Salon not found.'
      });
    }

    // Check if client already in this salon's list
    let salonClient = await SalonClient.findOne({
      salonId: salon._id,
      clientId: req.user.id
    });

    if (salonClient) {
      return res.json({
        success: true,
        message: 'You are already a client of this salon!',
        alreadyJoined: true,
        data: {
          salon: {
            id: salon._id,
            name: salon.name,
            description: salon.description,
            logo: salon.logo,
            phone: salon.phone,
            email: salon.email,
            address: salon.address
          }
        }
      });
    }

    // Add client to salon's client list
    salonClient = await SalonClient.create({
      salonId: salon._id,
      clientId: req.user.id,
      joinMethod: 'qr_code',
      status: 'active',
      joinedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: `🎉 Welcome to ${salon.name}! You can now book appointments here.`,
      alreadyJoined: false,
      data: {
        salon: {
          id: salon._id,
          name: salon.name,
          description: salon.description,
          logo: salon.logo,
          phone: salon.phone,
          email: salon.email,
          address: salon.address
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerViaQR,
  getSalonInfoForQR,
  joinSalonViaQR
};

