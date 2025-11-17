const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// This will be initialized when FCM credentials are provided
let initialized = false;

const initializeFirebase = () => {
  if (initialized) return;

  try {
    // Check if Firebase credentials are provided
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccount) {
      console.warn('Firebase service account not configured. Push notifications will be disabled.');
      return;
    }

    // Parse service account (can be JSON string or path to file)
    let credentials;
    try {
      credentials = JSON.parse(serviceAccount);
    } catch (e) {
      // If parsing fails, assume it's a file path
      credentials = require(serviceAccount);
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });

    initialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    console.warn('Push notifications will be disabled until Firebase is configured.');
  }
};

/**
 * Send push notification to a user
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification data { title, body, data }
 * @returns {Promise<object>} Result of sending notification
 */
const sendPushNotification = async (userId, notification) => {
  if (!initialized) {
    initializeFirebase();
  }

  if (!initialized) {
    console.warn('Firebase not initialized. Cannot send push notification.');
    return { success: false, message: 'Push notifications not configured' };
  }

  try {
    const User = require('../models/User');
    const user = await User.findById(userId).select('pushTokens role');

    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      return { success: false, message: 'User has no push tokens registered' };
    }

    const { title, body, data = {} } = notification;

    // FCM requires that all values in the `data` payload are strings
    const safeData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      safeData[key] = String(value);
    });

    // Determine sound based on user role
    let soundFile = '/sounds/notification.mp3' // Default fallback
    if (user.role === 'Owner') {
      soundFile = '/sounds/owner-notification.mp3.mp3'
    } else if (user.role === 'Worker') {
      soundFile = '/sounds/worker-notification.mp3.mp3'
    } else if (user.role === 'Client') {
      soundFile = '/sounds/client-notification.mp3.mp3'
    }

    // Prepare FCM message
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...safeData,
        notificationId: safeData.notificationId || Date.now().toString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        userRole: user.role // Include user role in payload for service worker
      },
      // Web push specific
      webpush: {
        notification: {
          title,
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          sound: soundFile
        }
      }
    };

    // Send to all user's devices
    const results = [];
    for (const tokenData of user.pushTokens) {
      try {
        const result = await admin.messaging().send({
          ...message,
          token: tokenData.token
        });
        results.push({ success: true, token: tokenData.token, messageId: result });
      } catch (error) {
        console.error(`Error sending to token ${tokenData.token}:`, error);
        
        // If token is invalid, remove it
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          user.pushTokens = user.pushTokens.filter(t => t.token !== tokenData.token);
          await user.save();
        }
        
        results.push({ success: false, token: tokenData.token, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount > 0,
      message: `Sent to ${successCount} of ${results.length} devices`,
      results
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {object} notification - Notification data
 * @returns {Promise<object>} Result
 */
const sendBulkPushNotification = async (userIds, notification) => {
  const results = [];
  for (const userId of userIds) {
    const result = await sendPushNotification(userId, notification);
    results.push({ userId, ...result });
  }
  return results;
};

// Initialize on module load
initializeFirebase();

module.exports = {
  sendPushNotification,
  sendBulkPushNotification,
  initializeFirebase
};


