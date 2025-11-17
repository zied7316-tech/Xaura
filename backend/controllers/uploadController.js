const Salon = require('../models/Salon');
const Service = require('../models/Service');
const User = require('../models/User');

/**
 * @desc    Upload salon logo/image
 * @route   POST /api/upload/salon/:id
 * @access  Private (Owner)
 */
const uploadSalonImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Check ownership
    if (salon.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get image URL
    // Cloudinary: req.file.url or req.file.secure_url contains the full URL
    // Local storage: req.file.filename contains just the filename
    let imageUrl;
    
    // Check for Cloudinary URL (multer-storage-cloudinary uses 'url' or 'secure_url')
    if (req.file.url) {
      imageUrl = req.file.url;
    } else if (req.file.secure_url) {
      imageUrl = req.file.secure_url;
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      // Fallback: some configurations use path
      imageUrl = req.file.path;
    } else {
      // Local storage path
      imageUrl = `/uploads/salons/${req.file.filename}`;
    }
    
    console.log('📤 Uploading salon image:', {
      fileKeys: Object.keys(req.file),
      url: req.file.url,
      secure_url: req.file.secure_url,
      path: req.file.path,
      filename: req.file.filename,
      finalImageUrl: imageUrl
    });
    
    salon.logo = imageUrl;
    await salon.save();

    // Verify the save worked
    const updatedSalon = await Salon.findById(req.params.id);
    console.log('✅ Salon logo saved to DB:', updatedSalon.logo);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        salon: updatedSalon
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload service image
 * @route   POST /api/upload/service/:id
 * @access  Private (Owner)
 */
const uploadServiceImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const service = await Service.findById(req.params.id).populate('salonId');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.salonId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get image URL
    // Cloudinary: req.file.url or req.file.secure_url contains the full URL
    // Local storage: req.file.filename contains just the filename
    let imageUrl;
    
    // Check for Cloudinary URL (multer-storage-cloudinary uses 'url' or 'secure_url')
    if (req.file.url) {
      imageUrl = req.file.url;
    } else if (req.file.secure_url) {
      imageUrl = req.file.secure_url;
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      // Fallback: some configurations use path
      imageUrl = req.file.path;
    } else {
      // Local storage path
      imageUrl = `/uploads/services/${req.file.filename}`;
    }
    
    console.log('📤 Uploading service image:', {
      fileKeys: Object.keys(req.file),
      url: req.file.url,
      secure_url: req.file.secure_url,
      path: req.file.path,
      filename: req.file.filename,
      finalImageUrl: imageUrl
    });
    
    // Update service with image
    const updatedService = await Service.findByIdAndUpdate(req.params.id, {
      $set: { image: imageUrl }
    }, { new: true });
    
    console.log('✅ Service image saved to DB:', updatedService?.image);

    res.json({
      success: true,
      message: 'Service image uploaded successfully',
      data: {
        imageUrl,
        serviceId: service._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload worker profile picture
 * @route   POST /api/upload/worker/:id
 * @access  Private (Owner or Worker themselves)
 */
const uploadWorkerImage = async (req, res, next) => {
  try {
    console.log('🔍 Upload request received:', {
      workerId: req.params.id,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        keys: Object.keys(req.file),
        url: req.file.url,
        secure_url: req.file.secure_url,
        path: req.file.path,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const worker = await User.findById(req.params.id);
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    console.log('👤 Worker found:', {
      id: worker._id,
      name: worker.name,
      currentAvatar: worker.avatar
    });

    // Check authorization (owner of salon or worker themselves)
    const Salon = require('../models/Salon');
    const salon = await Salon.findById(worker.salonId);
    
    const isOwner = salon && salon.ownerId.toString() === req.user.id;
    const isSelf = worker._id.toString() === req.user.id;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get image URL
    // Cloudinary: req.file.url or req.file.secure_url contains the full URL
    // Local storage: req.file.filename contains just the filename
    let imageUrl;
    
    // Check for Cloudinary URL (multer-storage-cloudinary uses 'url' or 'secure_url')
    if (req.file.url) {
      imageUrl = req.file.url;
      console.log('☁️  Using Cloudinary URL from req.file.url');
    } else if (req.file.secure_url) {
      imageUrl = req.file.secure_url;
      console.log('☁️  Using Cloudinary URL from req.file.secure_url');
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      // Fallback: some configurations use path
      imageUrl = req.file.path;
      console.log('☁️  Using Cloudinary URL from req.file.path');
    } else {
      // Local storage path
      imageUrl = `/uploads/workers/${req.file.filename}`;
      console.log('💾 Using local storage path');
    }
    
    console.log('📤 Uploading worker image:', {
      fileKeys: Object.keys(req.file),
      url: req.file.url,
      secure_url: req.file.secure_url,
      path: req.file.path,
      filename: req.file.filename,
      finalImageUrl: imageUrl,
      oldAvatar: worker.avatar
    });
    
    // Update worker avatar
    worker.avatar = imageUrl;
    const saveResult = await worker.save();
    
    console.log('💾 Save result:', {
      avatar: saveResult.avatar,
      _id: saveResult._id
    });
    
    // Verify the save worked by re-querying
    const verifyWorker = await User.findById(req.params.id);
    console.log('✅ Verification - Worker avatar in DB:', verifyWorker.avatar);
    
    if (verifyWorker.avatar !== imageUrl) {
      console.error('❌ ERROR: Database save verification failed!');
      console.error('Expected:', imageUrl);
      console.error('Got:', verifyWorker.avatar);
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        imageUrl,
        workerId: worker._id,
        verified: verifyWorker.avatar === imageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error in uploadWorkerImage:', error);
    next(error);
  }
};

/**
 * @desc    Delete salon logo/image
 * @route   DELETE /api/upload/salon/:id
 * @access  Private (Owner)
 */
const deleteSalonImage = async (req, res, next) => {
  try {
    const salon = await Salon.findById(req.params.id);
    
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Check ownership
    if (salon.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (salon.logo && (salon.logo.startsWith('http://') || salon.logo.startsWith('https://'))) {
      try {
        const cloudinary = require('../config/cloudinary').cloudinary;
        // Extract public_id from Cloudinary URL
        const urlParts = salon.logo.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1].split('.')[0];
        const folder = salon.logo.includes('/xaura/salons/') ? 'xaura/salons' : 'xaura';
        const publicId = `${folder}/${publicIdWithExt}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️  Deleted salon image from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary (continuing anyway):', cloudinaryError);
      }
    }

    salon.logo = '';
    await salon.save();

    console.log('✅ Salon logo deleted from DB');

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        salon: salon
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete service image
 * @route   DELETE /api/upload/service/:id
 * @access  Private (Owner)
 */
const deleteServiceImage = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate('salonId');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Check ownership
    if (service.salonId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (service.image && (service.image.startsWith('http://') || service.image.startsWith('https://'))) {
      try {
        const cloudinary = require('../config/cloudinary').cloudinary;
        // Extract public_id from Cloudinary URL
        const urlParts = service.image.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1].split('.')[0];
        const folder = service.image.includes('/xaura/services/') ? 'xaura/services' : 'xaura';
        const publicId = `${folder}/${publicIdWithExt}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️  Deleted service image from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary (continuing anyway):', cloudinaryError);
      }
    }

    await Service.findByIdAndUpdate(req.params.id, {
      $set: { image: '' }
    });

    console.log('✅ Service image deleted from DB');

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload user profile picture (for any role: Client, Owner, Worker)
 * @route   POST /api/upload/user/:id
 * @access  Private (User themselves)
 */
const uploadUserImage = async (req, res, next) => {
  try {
    console.log('🔍 Upload request received:', {
      userId: req.params.id,
      requestingUserId: req.user?.id,
      requestingUserRole: req.user?.role,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        keys: Object.keys(req.file),
        url: req.file.url,
        secure_url: req.file.secure_url,
        path: req.file.path,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    if (!req.user) {
      console.error('❌ No user in request (should not happen with protect middleware)');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.error('❌ User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('👤 User found:', {
      id: user._id,
      name: user.name,
      role: user.role,
      currentAvatar: user.avatar
    });

    // Check authorization - user can only update their own avatar
    if (user._id.toString() !== req.user.id.toString()) {
      console.error('❌ Authorization failed:', {
        userId: user._id.toString(),
        requestingUserId: req.user.id.toString(),
        match: user._id.toString() === req.user.id.toString()
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized - you can only update your own profile picture'
      });
    }

    console.log('✅ Authorization passed - user updating their own profile');

    // Get image URL
    // Cloudinary: req.file.url or req.file.secure_url contains the full URL
    // Local storage: req.file.filename contains just the filename
    let imageUrl;
    
    // Check for Cloudinary URL (multer-storage-cloudinary uses 'url' or 'secure_url')
    if (req.file.url) {
      imageUrl = req.file.url;
      console.log('☁️  Using Cloudinary URL from req.file.url');
    } else if (req.file.secure_url) {
      imageUrl = req.file.secure_url;
      console.log('☁️  Using Cloudinary URL from req.file.secure_url');
    } else if (req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
      // Fallback: some configurations use path
      imageUrl = req.file.path;
      console.log('☁️  Using Cloudinary URL from req.file.path');
    } else {
      // Local storage path - use profiles folder for all users
      imageUrl = `/uploads/profiles/${req.file.filename}`;
      console.log('💾 Using local storage path');
    }
    
    console.log('📤 Uploading user image:', {
      fileKeys: Object.keys(req.file),
      url: req.file.url,
      secure_url: req.file.secure_url,
      path: req.file.path,
      filename: req.file.filename,
      finalImageUrl: imageUrl,
      oldAvatar: user.avatar
    });
    
    // Update user avatar
    user.avatar = imageUrl;
    const saveResult = await user.save();
    
    console.log('💾 Save result:', {
      avatar: saveResult.avatar,
      _id: saveResult._id,
      role: saveResult.role
    });
    
    // Verify the save worked by re-querying
    const verifyUser = await User.findById(req.params.id);
    console.log('✅ Verification - User avatar in DB:', verifyUser.avatar);
    
    if (verifyUser.avatar !== imageUrl) {
      console.error('❌ ERROR: Database save verification failed!');
      console.error('Expected:', imageUrl);
      console.error('Got:', verifyUser.avatar);
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        imageUrl,
        userId: user._id,
        role: user.role,
        verified: verifyUser.avatar === imageUrl
      }
    });
  } catch (error) {
    console.error('❌ Error in uploadUserImage:', error);
    next(error);
  }
};

/**
 * @desc    Delete user profile picture (for any role)
 * @route   DELETE /api/upload/user/:id
 * @access  Private (User themselves)
 */
const deleteUserImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check authorization - user can only delete their own avatar
    if (user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))) {
      try {
        const cloudinary = require('../config/cloudinary').cloudinary;
        // Extract public_id from Cloudinary URL
        const urlParts = user.avatar.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1].split('.')[0];
        // Check which folder it's in
        let folder = 'xaura/profiles';
        if (user.avatar.includes('/xaura/workers/')) {
          folder = 'xaura/workers';
        } else if (user.avatar.includes('/xaura/profiles/')) {
          folder = 'xaura/profiles';
        }
        const publicId = `${folder}/${publicIdWithExt}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️  Deleted user image from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary (continuing anyway):', cloudinaryError);
      }
    }

    user.avatar = '';
    await user.save();

    console.log('✅ User avatar deleted from DB');

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete worker profile picture
 * @route   DELETE /api/upload/worker/:id
 * @access  Private (Owner or Worker themselves)
 */
const deleteWorkerImage = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check authorization (owner of salon or worker themselves)
    const Salon = require('../models/Salon');
    const salon = await Salon.findById(worker.salonId);
    
    const isOwner = salon && salon.ownerId.toString() === req.user.id;
    const isSelf = worker._id.toString() === req.user.id;

    if (!isOwner && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (worker.avatar && (worker.avatar.startsWith('http://') || worker.avatar.startsWith('https://'))) {
      try {
        const cloudinary = require('../config/cloudinary').cloudinary;
        // Extract public_id from Cloudinary URL
        const urlParts = worker.avatar.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1].split('.')[0];
        const folder = worker.avatar.includes('/xaura/workers/') ? 'xaura/workers' : 'xaura';
        const publicId = `${folder}/${publicIdWithExt}`;
        
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️  Deleted worker image from Cloudinary:', publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary (continuing anyway):', cloudinaryError);
      }
    }

    worker.avatar = '';
    await worker.save();

    console.log('✅ Worker avatar deleted from DB');

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSalonImage,
  uploadServiceImage,
  uploadWorkerImage,
  uploadUserImage,
  deleteSalonImage,
  deleteServiceImage,
  deleteWorkerImage,
  deleteUserImage
};

