import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

// Firebase configuration
// TODO: Replace with your Firebase project config
// Get this from Firebase Console: Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
}

// Initialize Firebase
let app = null
let messaging = null

const initFirebase = async () => {
  if (app) return app

  try {
    app = initializeApp(firebaseConfig)
    
    // Check if messaging is supported
    const supported = await isSupported()
    if (supported) {
      messaging = getMessaging(app)
    } else {
      console.warn('Firebase Cloud Messaging is not supported in this browser')
    }
    
    return app
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    return null
  }
}

// Get FCM token for push notifications
export const getFCMToken = async () => {
  try {
    await initFirebase()

    if (!messaging) {
      console.warn('Messaging not available')
      return null
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported in this browser')
      return null
    }

    // Wait for service worker to be ready
    let registration
    try {
      registration = await navigator.serviceWorker.ready
      if (!registration) {
        // Try to register if not already registered
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        })
        console.log('Service Worker registered for FCM:', registration)
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }

    // Get VAPID key from environment
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.warn('VAPID key not configured. Please add VITE_FIREBASE_VAPID_KEY to your .env file.')
      console.warn('Push notifications will not work without a VAPID key.')
      return null
    }

    // Get FCM token
    try {
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      })

      if (token) {
        console.log('FCM Token obtained successfully:', token.substring(0, 20) + '...')
        return token
      } else {
        console.warn('No FCM token available. User may need to grant notification permission.')
        return null
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      if (error.code === 'messaging/permission-blocked') {
        console.warn('Notification permission is blocked. User needs to enable it in browser settings.')
      }
      return null
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
// Returns a callback function that can be used to set up the listener
export const setupMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Messaging not available')
    return null
  }

  try {
    return onMessage(messaging, (payload) => {
      console.log('Message received:', payload)
      if (callback) {
        callback(payload)
      }
    })
  } catch (error) {
    console.error('Error setting up message listener:', error)
    return null
  }
}

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator
}

// Check notification permission
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'not-supported'
  }
  return Notification.permission
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'not-supported'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

// Initialize Firebase on import
initFirebase()

export default { getFCMToken, setupMessageListener, isNotificationSupported, getNotificationPermission, requestNotificationPermission }

