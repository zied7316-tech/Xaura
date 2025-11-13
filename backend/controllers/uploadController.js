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

    // Save image URL
    const imageUrl = `/uploads/salons/${req.file.filename}`;
    salon.logo = imageUrl;
    await salon.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        salon
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

    // Add image field to service model if not exists
    const imageUrl = `/uploads/services/${req.file.filename}`;
    
    // Update service with image
    await Service.findByIdAndUpdate(req.params.id, {
      $set: { image: imageUrl }
    });

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

    // Save image URL
    const imageUrl = `/uploads/workers/${req.file.filename}`;
    worker.avatar = imageUrl;
    await worker.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        imageUrl,
        workerId: worker._id
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSalonImage,
  uploadServiceImage,
  uploadWorkerImage
};

