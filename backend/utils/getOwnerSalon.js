const SalonOwnership = require('../models/SalonOwnership');
const Salon = require('../models/Salon');
const User = require('../models/User');

/**
 * Get owner's salon ID
 * Supports both multi-salon system (SalonOwnership) and legacy single-salon (salonId)
 * 
 * @param {string} ownerId - Owner user ID
 * @param {string} preferredSalonId - Optional: specific salon ID to check access for
 * @returns {Promise<{salonId: ObjectId, salon: Salon, isPrimary: boolean}|null>}
 */
const getOwnerSalon = async (ownerId, preferredSalonId = null) => {
  try {
    // First, try to get from SalonOwnership (multi-salon system)
    let ownership = null;
    
    if (preferredSalonId) {
      // Check if owner has access to specific salon
      ownership = await SalonOwnership.findOne({
        user: ownerId,
        salon: preferredSalonId,
        isActive: true,
      }).populate('salon');
    } else {
      // Get primary salon or first salon
      ownership = await SalonOwnership.findOne({
        user: ownerId,
        isActive: true,
      })
        .populate('salon')
        .sort({ isPrimary: -1, createdAt: 1 });
    }

    if (ownership && ownership.salon) {
      return {
        salonId: ownership.salon._id,
        salon: ownership.salon,
        isPrimary: ownership.isPrimary,
        ownershipId: ownership._id,
      };
    }

    // Fallback: Check direct salonId (legacy single-salon system)
    const owner = await User.findById(ownerId).populate('salonId');
    if (owner && owner.salonId) {
      // Create ownership record for backward compatibility
      try {
        const newOwnership = await SalonOwnership.create({
          user: ownerId,
          salon: owner.salonId._id,
          role: 'owner',
          isPrimary: true,
          isActive: true,
          permissions: {
            canManageServices: true,
            canManageWorkers: true,
            canManageFinances: true,
            canManageSettings: true,
            canViewReports: true,
          }
        });

        return {
          salonId: owner.salonId._id,
          salon: owner.salonId,
          isPrimary: true,
          ownershipId: newOwnership._id,
        };
      } catch (error) {
        // Ownership might already exist, just return the salon
        return {
          salonId: owner.salonId._id,
          salon: owner.salonId,
          isPrimary: true,
        };
      }
    }

    // Last resort: Find salon by ownerId directly
    const salon = await Salon.findOne({ ownerId });
    if (salon) {
      // Create ownership record
      try {
        const newOwnership = await SalonOwnership.create({
          user: ownerId,
          salon: salon._id,
          role: 'owner',
          isPrimary: true,
          isActive: true,
          permissions: {
            canManageServices: true,
            canManageWorkers: true,
            canManageFinances: true,
            canManageSettings: true,
            canViewReports: true,
          }
        });

        return {
          salonId: salon._id,
          salon: salon,
          isPrimary: true,
          ownershipId: newOwnership._id,
        };
      } catch (error) {
        return {
          salonId: salon._id,
          salon: salon,
          isPrimary: true,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting owner salon:', error);
    return null;
  }
};

/**
 * Get owner's salon ID (simple version - just returns the ID)
 * @param {string} ownerId - Owner user ID
 * @returns {Promise<ObjectId|null>}
 */
const getOwnerSalonId = async (ownerId) => {
  const result = await getOwnerSalon(ownerId);
  return result ? result.salonId : null;
};

module.exports = {
  getOwnerSalon,
  getOwnerSalonId,
};

