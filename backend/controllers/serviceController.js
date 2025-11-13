const Service = require('../models/Service');
const Salon = require('../models/Salon');
const { validationResult } = require('express-validator');

/**
 * @desc    Create new service
 * @route   POST /api/services
 * @access  Private (Owner only)
 */
const createService = async (req, res, next) => {
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

    const { salonId } = req.body;

    // Verify salon exists and user is the owner
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    if (salon.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add services to this salon'
      });
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get service by ID
 * @route   GET /api/services/:id
 * @access  Public
 */
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('salonId', 'name phone address');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: { service }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:id
 * @access  Private (Owner only)
 */
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify salon ownership
    const salon = await Salon.findById(service.salonId);
    if (salon.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this service'
      });
    }

    // Don't allow changing salonId
    const { salonId, ...updateData } = req.body;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: { service: updatedService }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete service (soft delete by setting isActive to false)
 * @route   DELETE /api/services/:id
 * @access  Private (Owner only)
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Verify salon ownership
    const salon = await Salon.findById(service.salonId);
    if (salon.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this service'
      });
    }

    // Soft delete
    service.isActive = false;
    await service.save();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all services (with filters)
 * @route   GET /api/services
 * @access  Public
 */
const getAllServices = async (req, res, next) => {
  try {
    const { salonId, category, isActive = true } = req.query;

    const filter = { isActive };
    if (salonId) filter.salonId = salonId;
    if (category) filter.category = category;

    const services = await Service.find(filter)
      .populate('salonId', 'name')
      .sort({ category: 1, name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: { services }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createService,
  getServiceById,
  updateService,
  deleteService,
  getAllServices
};

