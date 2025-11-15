const User = require('../models/User');
const { validationResult } = require('express-validator');

/**
 * @desc    Get current user profile
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, bio, skills, experience, education, certifications } = req.body;
    
    // Build update object (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (certifications !== undefined) updateData.certifications = Array.isArray(certifications) ? certifications : [];

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};

