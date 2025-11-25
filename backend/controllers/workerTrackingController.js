const Salon = require('../models/Salon');
const User = require('../models/User');
const WorkerStatusLog = require('../models/WorkerStatusLog');
const GPSTrackingLog = require('../models/GPSTrackingLog');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

// Grace period constants
const GPS_GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes grace period

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
      // Check if GPS coordinates are missing (GPS disabled/denied/unavailable)
      if (!latitude || !longitude) {
        // GPS temporarily unavailable - check if worker was previously confirmed at salon (sticky status)
        if (worker.gpsTrackingStatus?.confirmedAtSalon && worker.gpsTrackingStatus?.lastConfirmedAtSalon) {
          // Worker was confirmed at salon - maintain status (sticky behavior)
          const timeSinceConfirmation = Date.now() - new Date(worker.gpsTrackingStatus.lastConfirmedAtSalon).getTime();
          const hoursSinceConfirmation = timeSinceConfirmation / (1000 * 60 * 60);
          
          // Keep available if confirmed within last 12 hours (full work day)
          if (hoursSinceConfirmation < 12) {
            return res.json({
              success: true,
              message: 'GPS temporarily unavailable, maintaining status (worker was at salon)',
              autoStatus: currentStatus,
              reason: `Last confirmed at salon ${Math.round(hoursSinceConfirmation * 60)} minutes ago`
            });
          }
        }
        
        // Check grace period - if last known location was outside and > 30 min ago, change status
        if (worker.gpsTrackingStatus?.lastKnownLocation && worker.gpsTrackingStatus?.lastLocationUpdate) {
          const timeSinceLastUpdate = Date.now() - new Date(worker.gpsTrackingStatus.lastLocationUpdate).getTime();
          
          if (timeSinceLastUpdate > GPS_GRACE_PERIOD_MS) {
            // Check if last known location was outside salon
            const salonLat = salon.workerTracking.gps.latitude;
            const salonLng = salon.workerTracking.gps.longitude;
            const radius = salon.workerTracking.gps.radius;
            
            if (salonLat && salonLng) {
              const lastDistance = calculateDistance(
                worker.gpsTrackingStatus.lastKnownLocation.latitude,
                worker.gpsTrackingStatus.lastKnownLocation.longitude,
                salonLat,
                salonLng
              );
              
              if (lastDistance > radius) {
                // Last known location was outside and it's been > 30 min - change status
                shouldBeAvailable = false;
                reason = `GPS unavailable - last known location was outside salon (${Math.round(timeSinceLastUpdate / 60000)} min ago)`;
              } else {
                // Last known location was at salon - maintain status
                return res.json({
                  success: true,
                  message: 'GPS unavailable, maintaining status (last known location was at salon)',
                  autoStatus: currentStatus,
                  reason: `Last known location was at salon ${Math.round(timeSinceLastUpdate / 60000)} min ago`
                });
              }
            }
          } else {
            // Within grace period - maintain status
            return res.json({
              success: true,
              message: 'GPS temporarily unavailable, maintaining status (within grace period)',
              autoStatus: currentStatus,
              reason: `GPS unavailable but within grace period (${Math.round(timeSinceLastUpdate / 60000)} min ago)`
            });
          }
        } else {
          // No last known location - only change if worker was NOT previously confirmed
          if (!worker.gpsTrackingStatus?.confirmedAtSalon) {
            shouldBeAvailable = false;
            reason = 'GPS unavailable or denied';
          } else {
            // Was confirmed but no recent location - maintain status
            return res.json({
              success: true,
              message: 'GPS unavailable, maintaining current status',
              autoStatus: currentStatus,
              reason: 'GPS unavailable but worker was previously at salon'
            });
          }
        }
      } else if (salon.workerTracking.gps.enabled) {
        // We have GPS coordinates - process location and log for analytics
        const salonLat = salon.workerTracking.gps.latitude;
        const salonLng = salon.workerTracking.gps.longitude;
        const radius = salon.workerTracking.gps.radius;

        if (salonLat && salonLng) {
          const distance = calculateDistance(latitude, longitude, salonLat, salonLng);
          
          // Log GPS tracking data for analytics (async - don't wait)
          GPSTrackingLog.create({
            workerId: workerId,
            salonId: worker.salonId,
            latitude: latitude,
            longitude: longitude,
            distanceFromSalon: distance,
            isAtSalon: distance <= radius,
            timestamp: new Date(),
            date: new Date(new Date().toDateString())
          }).catch(err => {
            console.error('[TRACKING] Error logging GPS data:', err);
          });
          
          // Update last known location
          if (!worker.gpsTrackingStatus) {
            worker.gpsTrackingStatus = {};
          }
          worker.gpsTrackingStatus.lastKnownLocation = { latitude, longitude };
          worker.gpsTrackingStatus.lastLocationUpdate = new Date();
          
          if (distance <= radius) {
            // Worker is at salon - confirm and set to available
            shouldBeAvailable = true;
            reason = `Within salon location (${Math.round(distance)}m away)`;
            
            // Mark as confirmed at salon (sticky status)
            worker.gpsTrackingStatus.confirmedAtSalon = true;
            worker.gpsTrackingStatus.lastConfirmedAtSalon = new Date();
          } else {
            // Worker is outside salon radius
            shouldBeAvailable = false;
            reason = `Outside salon location (${Math.round(distance)}m away, radius: ${radius}m)`;
            
            // Clear confirmation since they've left
            worker.gpsTrackingStatus.confirmedAtSalon = false;
            worker.gpsTrackingStatus.lastConfirmedAtSalon = null;
          }
          
          // Save tracking status
          await worker.save();
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

/**
 * @desc    Get worker GPS-based analytics (accurate arrival/departure/breaks)
 * @route   GET /api/worker-tracking/analytics/:workerId
 * @access  Private (Owner)
 */
const getWorkerGPSAnalytics = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify worker exists and belongs to owner's salon
    const worker = await User.findById(workerId).select('name salonId');
    if (!worker || !worker.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Verify owner has access to this worker's salon
    const ownerId = req.user.id;
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData || salonData.salonId.toString() !== worker.salonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this worker\'s analytics'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get all GPS logs for worker
    const logs = await GPSTrackingLog.find({
      workerId: workerId,
      timestamp: { $gte: start, $lte: end }
    }).sort({ timestamp: 1 });

    // Group by date
    const dailyStats = {};
    
    logs.forEach((log, index) => {
      const dateKey = log.date.toISOString().split('T')[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          arrivalTime: null,
          departureTime: null,
          totalMinutesAtSalon: 0,
          totalMinutesOutside: 0,
          breakPeriods: [],
          gpsUpdates: 0,
          lastLocationAtSalon: null
        };
      }

      const day = dailyStats[dateKey];
      day.gpsUpdates++;

      // Track arrival (first "at salon" of the day)
      if (log.isAtSalon && !day.arrivalTime) {
        day.arrivalTime = log.timestamp;
      }

      // Track last location at salon
      if (log.isAtSalon) {
        day.lastLocationAtSalon = log.timestamp;
      }

      // Track departure (last "at salon" before going outside or end of day)
      if (log.isAtSalon) {
        const nextLog = logs[index + 1];
        if (!nextLog || !nextLog.isAtSalon || 
            nextLog.date.toISOString().split('T')[0] !== dateKey) {
          day.departureTime = log.timestamp;
        }
      }

      // Calculate time spent (estimate based on time between logs)
      if (index > 0) {
        const prevLog = logs[index - 1];
        if (prevLog.date.toISOString().split('T')[0] === dateKey) {
          const timeDiff = (log.timestamp - prevLog.timestamp) / (1000 * 60); // minutes
          
          if (prevLog.isAtSalon) {
            day.totalMinutesAtSalon += timeDiff;
          } else {
            day.totalMinutesOutside += timeDiff;
            
            // Detect break (outside during work hours: 9 AM - 6 PM)
            const hour = log.timestamp.getHours();
            if (hour >= 9 && hour < 18) {
              day.breakPeriods.push({
                start: prevLog.timestamp,
                end: log.timestamp,
                duration: timeDiff
              });
            }
          }
        }
      }
    });

    // Calculate totals
    const totalStats = {
      totalDaysTracked: Object.keys(dailyStats).length,
      totalHoursAtSalon: 0,
      totalBreakHours: 0,
      averageHoursPerDay: 0,
      totalGPSUpdates: logs.length
    };

    Object.values(dailyStats).forEach(day => {
      totalStats.totalHoursAtSalon += day.totalMinutesAtSalon / 60;
      const breakMinutes = day.breakPeriods.reduce((sum, b) => sum + b.duration, 0);
      totalStats.totalBreakHours += breakMinutes / 60;
    });

    if (totalStats.totalDaysTracked > 0) {
      totalStats.averageHoursPerDay = totalStats.totalHoursAtSalon / totalStats.totalDaysTracked;
    }

    res.json({
      success: true,
      data: {
        worker: {
          id: worker._id,
          name: worker.name
        },
        period: { startDate: start, endDate: end },
        totalStats,
        dailyStats: Object.values(dailyStats).sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        )
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrackingSettings,
  updateTrackingSettings,
  reportLocation,
  getMySalonTrackingSettings,
  getWorkerGPSAnalytics
};

