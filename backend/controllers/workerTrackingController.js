const Salon = require('../models/Salon');
const User = require('../models/User');
const WorkerStatusLog = require('../models/WorkerStatusLog');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * @desc    Get worker tracking settings for salon
 * @route   GET /api/worker-tracking/settings
 * @access  Private (Owner)
 */
const getTrackingSettings = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salon = salonData.salon;

    res.json({
      success: true,
      data: {
        method: salon.workerTracking?.method || 'manual',
        wifi: salon.workerTracking?.wifi || {
          ssid: '',
          enabled: false
        },
        gps: salon.workerTracking?.gps || {
          latitude: null,
          longitude: null,
          radius: 100,
          enabled: false
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update worker tracking settings
 * @route   PUT /api/worker-tracking/settings
 * @access  Private (Owner)
 */
const updateTrackingSettings = async (req, res, next) => {
  try {
    const { method, wifi, gps } = req.body;
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salon = salonData.salon;

    // Validate method
    if (method && !['manual', 'wifi', 'gps'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tracking method. Must be: manual, wifi, or gps'
      });
    }

    // Initialize workerTracking if it doesn't exist
    if (!salon.workerTracking) {
      salon.workerTracking = {
        method: 'manual',
        wifi: { ssid: '', enabled: false },
        gps: { latitude: null, longitude: null, radius: 100, enabled: false }
      };
    }

    // Update method
    if (method) {
      salon.workerTracking.method = method;
    }

    // Update WiFi settings
    if (wifi !== undefined) {
      if (wifi.ssid !== undefined) {
        salon.workerTracking.wifi.ssid = wifi.ssid.trim();
      }
      if (wifi.enabled !== undefined) {
        salon.workerTracking.wifi.enabled = wifi.enabled;
      }
    }

    // Update GPS settings
    if (gps !== undefined) {
      if (gps.latitude !== undefined) {
        salon.workerTracking.gps.latitude = gps.latitude;
      }
      if (gps.longitude !== undefined) {
        salon.workerTracking.gps.longitude = gps.longitude;
      }
      if (gps.radius !== undefined) {
        if (gps.radius < 10 || gps.radius > 1000) {
          return res.status(400).json({
            success: false,
            message: 'GPS radius must be between 10 and 1000 meters'
          });
        }
        salon.workerTracking.gps.radius = gps.radius;
      }
      if (gps.enabled !== undefined) {
        salon.workerTracking.gps.enabled = gps.enabled;
      }
    }

    await salon.save();

    res.json({
      success: true,
      message: 'Tracking settings updated successfully',
      data: {
        method: salon.workerTracking.method,
        wifi: salon.workerTracking.wifi,
        gps: salon.workerTracking.gps
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get worker's salon tracking settings (for worker to check if tracking is enabled)
 * @route   GET /api/worker-tracking/my-salon-settings
 * @access  Private (Worker)
 */
const getMySalonTrackingSettings = async (req, res, next) => {
  try {
    const worker = await User.findById(req.user.id).select('salonId');
    
    if (!worker || !worker.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Worker not associated with a salon'
      });
    }

    const salon = await Salon.findById(worker.salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    res.json({
      success: true,
      data: {
        method: salon.workerTracking?.method || 'manual',
        isTrackingEnabled: salon.workerTracking?.method !== 'manual'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker reports WiFi connection or GPS location
 * @route   POST /api/worker-tracking/report
 * @access  Private (Worker)
 */
const reportLocation = async (req, res, next) => {
  try {
    const { wifiSSID, latitude, longitude } = req.body;
    const workerId = req.user.id;

    // Get worker's salon
    const worker = await User.findById(workerId);
    if (!worker || !worker.salonId) {
      return res.status(400).json({
        success: false,
        message: 'Worker must be assigned to a salon'
      });
    }

    const salon = await Salon.findById(worker.salonId);
    if (!salon || !salon.workerTracking) {
      return res.json({
        success: true,
        message: 'Tracking not configured for this salon',
        autoStatus: null
      });
    }

    const trackingMethod = salon.workerTracking.method;
    let shouldBeAvailable = false;
    let reason = '';

    // Check based on tracking method
    if (trackingMethod === 'wifi') {
      if (wifiSSID && salon.workerTracking.wifi.enabled) {
        const salonSSID = salon.workerTracking.wifi.ssid.trim().toLowerCase();
        const reportedSSID = wifiSSID.trim().toLowerCase();
        
        if (reportedSSID === salonSSID) {
          shouldBeAvailable = true;
          reason = 'Connected to salon WiFi';
        } else {
          shouldBeAvailable = false;
          reason = 'Not connected to salon WiFi';
        }
      }
    } else if (trackingMethod === 'gps') {
      if (latitude && longitude && salon.workerTracking.gps.enabled) {
        const salonLat = salon.workerTracking.gps.latitude;
        const salonLng = salon.workerTracking.gps.longitude;
        const radius = salon.workerTracking.gps.radius;

        if (salonLat && salonLng) {
          const distance = calculateDistance(latitude, longitude, salonLat, salonLng);
          
          if (distance <= radius) {
            shouldBeAvailable = true;
            reason = `Within salon location (${Math.round(distance)}m away)`;
          } else {
            shouldBeAvailable = false;
            reason = `Outside salon location (${Math.round(distance)}m away, radius: ${radius}m)`;
          }
        }
      }
    } else {
      // Manual mode - no automatic status change
      return res.json({
        success: true,
        message: 'Manual tracking mode - status changes must be done manually',
        autoStatus: null
      });
    }

    // Update worker status if needed
    const currentStatus = worker.currentStatus || 'offline';
    let newStatus = shouldBeAvailable ? 'available' : 'offline';
    
    // If worker was "available" and now disconnecting, set to "on_break" instead of "offline"
    // This handles the case where worker goes out in the middle of the day
    if (currentStatus === 'available' && !shouldBeAvailable) {
      // Check if it's during working hours (9 AM - 6 PM) to determine if it's a break
      const now = new Date();
      const currentHour = now.getHours();
      const isWorkingHours = currentHour >= 9 && currentHour < 18;
      
      if (isWorkingHours) {
        newStatus = 'on_break';
        reason = reason + ' (Set to On Break)';
      }
    }

    if (currentStatus !== newStatus) {
      const previousStatusChangeTime = worker.lastStatusChange || new Date();
      const now = new Date();
      const durationInMinutes = Math.floor((now - new Date(previousStatusChangeTime)) / 60000);

      // Log the status change
      await WorkerStatusLog.create({
        workerId: workerId,
        salonId: worker.salonId,
        previousStatus: currentStatus,
        newStatus: newStatus,
        changedAt: now,
        durationInPreviousStatus: durationInMinutes,
        date: new Date(now.toDateString()),
        autoTracked: true,
        trackingReason: reason
      });

      // Update worker status
      worker.currentStatus = newStatus;
      worker.lastStatusChange = now;
      await worker.save();

      return res.json({
        success: true,
        message: `Status automatically updated to ${newStatus}`,
        autoStatus: newStatus,
        reason: reason,
        previousStatus: currentStatus
      });
    }

    res.json({
      success: true,
      message: 'Location reported, status unchanged',
      autoStatus: currentStatus,
      reason: reason
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

module.exports = {
  getTrackingSettings,
  updateTrackingSettings,
  reportLocation,
  getMySalonTrackingSettings
};

