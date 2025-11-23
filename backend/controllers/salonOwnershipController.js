const SalonOwnership = require('../models/SalonOwnership');
const Salon = require('../models/Salon');
const User = require('../models/User');

/**
 * @desc    Get all salons owned by current user
 * @route   GET /api/my-salons
 * @access  Private/Owner
 */
exports.getMySalons = async (req, res) => {
  try {
    // Get salons from SalonOwnership (new system)
    const ownerships = await SalonOwnership.find({
      user: req.user._id,
      isActive: true,
    })
      .populate('salon')
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean();

    const salonsFromOwnership = ownerships.map((ownership) => ({
      ...ownership.salon,
      ownershipId: ownership._id,
      role: ownership.role,
      permissions: ownership.permissions,
      isPrimary: ownership.isPrimary,
    }));

    // Also get salons with direct ownerId (backward compatibility for old salons)
    const directSalons = await Salon.find({
      ownerId: req.user._id,
    }).lean();

    // Get salon IDs that already have ownership records
    const ownedSalonIds = new Set(salonsFromOwnership.map(s => s._id.toString()));

    // For salons without ownership records, create them on-the-fly
    const salonsToAdd = [];
    for (const salon of directSalons) {
      if (!ownedSalonIds.has(salon._id.toString())) {
        // Check if this is the first salon
        const isFirstSalon = salonsFromOwnership.length === 0 && salonsToAdd.length === 0;
        
        // Create ownership record for backward compatibility
        try {
          const ownership = await SalonOwnership.create({
            user: req.user._id,
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

          salonsToAdd.push({
            ...salon,
            ownershipId: ownership._id,
            role: 'owner',
            permissions: ownership.permissions,
            isPrimary: ownership.isPrimary,
          });
        } catch (error) {
          // If ownership already exists (race condition), just add the salon
          console.log('Ownership might already exist, adding salon anyway');
          salonsToAdd.push({
            ...salon,
            role: 'owner',
            isPrimary: false,
          });
        }
      }
    }

    // Combine both lists
    const allSalons = [...salonsFromOwnership, ...salonsToAdd].sort((a, b) => {
      // Sort by isPrimary first, then by creation date
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });

    res.json({
      success: true,
      count: allSalons.length,
      data: allSalons,
    });
  } catch (error) {
    console.error('Error fetching owned salons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salons',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single salon details (if user has access)
 * @route   GET /api/my-salons/:id
 * @access  Private/Owner
 */
exports.getMySalon = async (req, res) => {
  try {
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      isActive: true,
    }).populate('salon');

    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have access',
      });
    }

    res.json({
      success: true,
      data: {
        ...ownership.salon.toObject(),
        ownershipId: ownership._id,
        role: ownership.role,
        permissions: ownership.permissions,
        isPrimary: ownership.isPrimary,
      },
    });
  } catch (error) {
    console.error('Error fetching salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon',
      error: error.message,
    });
  }
};

/**
 * @desc    Set primary salon
 * @route   PUT /api/my-salons/:id/set-primary
 * @access  Private/Owner
 */
exports.setPrimarySalon = async (req, res) => {
  try {
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      isActive: true,
    });

    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you do not have access',
      });
    }

    ownership.isPrimary = true;
    await ownership.save();

    res.json({
      success: true,
      message: 'Primary salon updated successfully',
    });
  } catch (error) {
    console.error('Error setting primary salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary salon',
      error: error.message,
    });
  }
};

/**
 * @desc    Add a new salon (create and link to owner)
 * @route   POST /api/my-salons
 * @access  Private/Owner
 */
exports.addSalon = async (req, res) => {
  try {
    const { name, email, phone, address, description } = req.body;

    // Create new salon
    const salon = await Salon.create({
      name,
      email,
      phone,
      address,
      description,
      ownerId: req.user._id,
    });

    // Check if this is user's first salon
    const existingSalons = await SalonOwnership.countDocuments({
      user: req.user._id,
    });

    // Create ownership
    const ownership = await SalonOwnership.create({
      user: req.user._id,
      salon: salon._id,
      role: 'owner',
      isPrimary: existingSalons === 0, // First salon is primary
    });

    // If this is first salon, update user's salonId for backward compatibility
    if (existingSalons === 0) {
      await User.findByIdAndUpdate(req.user._id, {
        salonId: salon._id,
      });
    }

    // Create trial subscription automatically
    const Subscription = require('../models/Subscription');
    const { createTrialSubscription } = require('../config/subscriptionPlans');
    await Subscription.create(createTrialSubscription(salon._id, req.user._id));

    res.status(201).json({
      success: true,
      message: 'Salon added successfully',
      data: {
        ...salon.toObject(),
        ownershipId: ownership._id,
        role: ownership.role,
        isPrimary: ownership.isPrimary,
      },
    });
  } catch (error) {
    console.error('Error adding salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add salon',
      error: error.message,
    });
  }
};

/**
 * @desc    Transfer salon ownership to another user
 * @route   POST /api/my-salons/:id/transfer
 * @access  Private/Owner
 */
exports.transferSalonOwnership = async (req, res) => {
  try {
    const { newOwnerEmail } = req.body;

    // Check if current user owns this salon
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      role: 'owner',
      isActive: true,
    });

    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you are not the owner',
      });
    }

    // Find new owner
    const newOwner = await User.findOne({ email: newOwnerEmail, role: 'Owner' });

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: 'New owner not found',
      });
    }

    // Check if new owner already has access
    const existingOwnership = await SalonOwnership.findOne({
      user: newOwner._id,
      salon: req.params.id,
    });

    if (existingOwnership) {
      return res.status(400).json({
        success: false,
        message: 'User already has access to this salon',
      });
    }

    // Create new ownership for new owner
    await SalonOwnership.create({
      user: newOwner._id,
      salon: req.params.id,
      role: 'owner',
      isPrimary: false,
    });

    // Update salon's ownerId
    await Salon.findByIdAndUpdate(req.params.id, {
      ownerId: newOwner._id,
    });

    // Optionally: Remove old owner's access or change to manager
    // ownership.role = 'manager';
    // await ownership.save();

    res.json({
      success: true,
      message: 'Salon ownership transferred successfully',
    });
  } catch (error) {
    console.error('Error transferring ownership:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer ownership',
      error: error.message,
    });
  }
};

/**
 * @desc    Grant access to another user (add co-owner/manager)
 * @route   POST /api/my-salons/:id/grant-access
 * @access  Private/Owner
 */
exports.grantSalonAccess = async (req, res) => {
  try {
    const { userEmail, role = 'manager', permissions } = req.body;

    // Check if current user owns this salon
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      role: 'owner',
      isActive: true,
    });

    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you are not the owner',
      });
    }

    // Find user to grant access
    const targetUser = await User.findOne({ email: userEmail, role: 'Owner' });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already has access
    const existingOwnership = await SalonOwnership.findOne({
      user: targetUser._id,
      salon: req.params.id,
    });

    if (existingOwnership) {
      return res.status(400).json({
        success: false,
        message: 'User already has access to this salon',
      });
    }

    // Create new ownership
    await SalonOwnership.create({
      user: targetUser._id,
      salon: req.params.id,
      role,
      permissions: permissions || {},
      isPrimary: false,
    });

    res.json({
      success: true,
      message: 'Access granted successfully',
    });
  } catch (error) {
    console.error('Error granting access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to grant access',
      error: error.message,
    });
  }
};

/**
 * @desc    Revoke user access to salon
 * @route   DELETE /api/my-salons/:id/revoke-access/:userId
 * @access  Private/Owner
 */
exports.revokeSalonAccess = async (req, res) => {
  try {
    // Check if current user owns this salon
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      role: 'owner',
      isActive: true,
    });

    if (!ownership) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found or you are not the owner',
      });
    }

    // Find and remove target user's access
    const targetOwnership = await SalonOwnership.findOne({
      user: req.params.userId,
      salon: req.params.id,
      role: { $ne: 'owner' }, // Cannot revoke owner access
    });

    if (!targetOwnership) {
      return res.status(404).json({
        success: false,
        message: 'User access not found',
      });
    }

    await targetOwnership.deleteOne();

    res.json({
      success: true,
      message: 'Access revoked successfully',
    });
  } catch (error) {
    console.error('Error revoking access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke access',
      error: error.message,
    });
  }
};

/**
 * @desc    Check if user has access to salon
 * @route   GET /api/my-salons/:id/check-access
 * @access  Private/Owner
 */
exports.checkSalonAccess = async (req, res) => {
  try {
    const ownership = await SalonOwnership.findOne({
      user: req.user._id,
      salon: req.params.id,
      isActive: true,
    });

    res.json({
      success: true,
      hasAccess: !!ownership,
      role: ownership?.role,
      permissions: ownership?.permissions,
    });
  } catch (error) {
    console.error('Error checking access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check access',
      error: error.message,
    });
  }
};


