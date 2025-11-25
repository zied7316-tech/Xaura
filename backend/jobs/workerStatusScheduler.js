const cron = require('node-cron');
const User = require('../models/User');
const Salon = require('../models/Salon');
const WorkerStatusLog = require('../models/WorkerStatusLog');

/**
 * Auto-set workers to offline at end of work day
 * Runs every hour to check if work day has ended
 */
const checkEndOfDay = async () => {
  try {
    console.log('[SCHEDULER] Checking end of work day for workers...');
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[currentDay];
    
    // Get all workers with GPS tracking enabled and currently available/on break
    const workers = await User.find({
      role: 'Worker',
      isActive: true,
      salonId: { $ne: null },
      currentStatus: { $in: ['available', 'on_break'] },
      'gpsTrackingStatus.confirmedAtSalon': true
    }).populate('salonId', 'workingHours');
    
    let updatedCount = 0;
    
    for (const worker of workers) {
      if (!worker.salonId || !worker.salonId.workingHours) continue;
      
      const workingHours = worker.salonId.workingHours[dayName];
      if (!workingHours || workingHours.isClosed) {
        // Salon is closed today - set worker offline
        await setWorkerOffline(worker, 'Salon is closed today');
        updatedCount++;
        continue;
      }
      
      // Parse closing time
      const [closeHour, closeMin] = workingHours.close.split(':').map(Number);
      const closingTime = new Date(now);
      closingTime.setHours(closeHour, closeMin, 0, 0);
      
      // Add 1 hour buffer after closing time
      const bufferTime = new Date(closingTime);
      bufferTime.setHours(bufferTime.getHours() + 1);
      
      // If current time is past closing + buffer, set to offline
      if (now > bufferTime) {
        await setWorkerOffline(worker, 'End of work day - automatically set to offline');
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`[SCHEDULER] Set ${updatedCount} worker(s) to offline (end of day)`);
    } else {
      console.log('[SCHEDULER] No workers need to be set offline');
    }
  } catch (error) {
    console.error('[SCHEDULER] Error in end of day check:', error);
  }
};

/**
 * Helper function to set worker offline and log the change
 */
const setWorkerOffline = async (worker, reason) => {
  try {
    const previousStatusChangeTime = worker.lastStatusChange || new Date();
    const now = new Date();
    const durationInMinutes = Math.floor((now - new Date(previousStatusChangeTime)) / 60000);
    
    // Log the status change
    await WorkerStatusLog.create({
      workerId: worker._id,
      salonId: worker.salonId._id || worker.salonId,
      previousStatus: worker.currentStatus,
      newStatus: 'offline',
      changedAt: now,
      durationInPreviousStatus: durationInMinutes,
      date: new Date(now.toDateString()),
      autoTracked: true,
      trackingReason: reason
    });
    
    // Update worker status
    worker.currentStatus = 'offline';
    worker.lastStatusChange = now;
    
    // Clear GPS confirmation for next day
    if (worker.gpsTrackingStatus) {
      worker.gpsTrackingStatus.confirmedAtSalon = false;
      worker.gpsTrackingStatus.lastConfirmedAtSalon = null;
    }
    
    await worker.save();
    
    console.log(`[SCHEDULER] Set worker ${worker._id} (${worker.name}) to offline - ${reason}`);
  } catch (error) {
    console.error(`[SCHEDULER] Error setting worker ${worker._id} offline:`, error);
  }
};

// Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
cron.schedule('0 * * * *', checkEndOfDay);

// Also run at startup (with delay to let server fully initialize)
setTimeout(() => {
  console.log('[SCHEDULER] Running initial end of day check...');
  checkEndOfDay();
}, 10000); // 10 seconds after server starts

module.exports = { checkEndOfDay, setWorkerOffline };

