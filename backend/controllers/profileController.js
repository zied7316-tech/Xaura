const User = require('../models/User');
const { generateUniqueUserID } = require('../models/User');
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

    const { name, phone, bio, skills, experience, education, certifications, worksAsWorker } = req.body;
    
    // Build update object (only include fields that are provided)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;
    if (certifications !== undefined) updateData.certifications = Array.isArray(certifications) ? certifications : [];
    // Only allow owners to set worksAsWorker
    if (worksAsWorker !== undefined && req.user.role === 'Owner') {
      updateData.worksAsWorker = worksAsWorker;
    }

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

/**
 * @desc    Regenerate userID for current user
 * @route   POST /api/profile/regenerate-userid
 * @access  Private
 */
const regenerateUserID = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new unique userID
    let newUserID;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 4-digit number (1000-9999)
      newUserID = String(Math.floor(1000 + Math.random() * 9000));
      
      // Check if this userID already exists (excluding current user)
      const existingUser = await User.findOne({ 
        userID: newUserID,
        _id: { $ne: user._id }
      });
      
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique userID. Please try again.'
      });
    }

    // Update user with new userID
    user.userID = newUserID;
    await user.save();

    res.json({
      success: true,
      message: 'User ID regenerated successfully',
      data: { 
        userID: newUserID,
        user: await User.findById(user._id).select('-password')
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  regenerateUserID
};

