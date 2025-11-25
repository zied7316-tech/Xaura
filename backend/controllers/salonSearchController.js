const Salon = require('../models/Salon');
const Service = require('../models/Service');

/**
 * @desc    Search salons (public/client access)
 * @route   GET /api/salon-search
 * @access  Public
 */
const searchSalons = async (req, res, next) => {
  try {
    const { 
      query, 
      city, 
      services, 
      sortBy = 'name',
      limit = 20 
    } = req.query;

    // Build search filter
    const filter = { isActive: true };

    // Text search on name and description
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Filter by city
    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'name':
        sort.name = 1;
        break;
      case 'newest':
        sort.createdAt = -1;
        break;
      default:
        sort.name = 1;
    }

    // Execute query
    let salons = await Salon.find(filter)
      .select('name description logo phone email address qrCode slug createdAt')
      .sort(sort)
      .limit(parseInt(limit));

    // If filtering by services, get salons that offer those services
    if (services) {
      const serviceNames = services.split(',').map(s => s.trim());
      const serviceFilter = {
        name: { $in: serviceNames.map(name => new RegExp(name, 'i')) },
        isActive: true
      };
      
      const matchingServices = await Service.find(serviceFilter).distinct('salonId');
      
      // Filter salons to only those offering the services
      salons = salons.filter(salon => 
        matchingServices.some(id => id.toString() === salon._id.toString())
      );
    }

    // Enrich with service count
    const salonIds = salons.map(s => s._id);
    const serviceCounts = await Service.aggregate([
      { $match: { salonId: { $in: salonIds }, isActive: true } },
      { $group: { _id: '$salonId', count: { $sum: 1 } } }
    ]);

    const serviceCountMap = {};
    serviceCounts.forEach(item => {
      serviceCountMap[item._id.toString()] = item.count;
    });

    // Add service count to each salon
    const enrichedSalons = salons.map(salon => ({
      ...salon.toObject(),
      serviceCount: serviceCountMap[salon._id.toString()] || 0
    }));

    res.json({
      success: true,
      count: enrichedSalons.length,
      data: enrichedSalons
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get salon details by ID (public)
 * @route   GET /api/salon-search/:id
 * @access  Public
 */
const getSalonDetails = async (req, res, next) => {
  try {
    const salonId = req.params.id;

    // Validate salon ID
    if (!salonId || salonId === 'undefined' || salonId === 'null') {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid salon ID format'
      });
    }

    const salon = await Salon.findById(salonId)
      .select('name description logo phone email address qrCode slug operatingHours createdAt');

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Get salon's services
    const services = await Service.find({
      salonId: salon._id,
      isActive: true
    }).select('name description image category duration price');

    // Get salon's workers (with full profile info)
    const User = require('../models/User');
    const workers = await User.find({
      salonId: salon._id,
      role: 'Worker',
      isActive: true
    }).select('name avatar bio skills experience education certifications currentStatus');

    res.json({
      success: true,
      data: {
        salon,
        services,
        workers,
        serviceCount: services.length,
        workerCount: workers.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all unique cities where salons are located
 * @route   GET /api/salon-search/cities
 * @access  Public
 */
const getSalonCities = async (req, res, next) => {
  try {
    const cities = await Salon.distinct('address.city', { isActive: true });
    
    res.json({
      success: true,
      data: cities.filter(city => city && city.trim() !== '')
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchSalons,
  getSalonDetails,
  getSalonCities
};

