// Firebase Cloud Messaging Service Worker
// This file must be in the public folder

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration
// Firebase project: xaura-b3973
const firebaseConfig = {
  apiKey: 'AIzaSyCdiQeRh7RvlFODh1eGSYx6aNx8joNlpLE',
  authDomain: 'xaura-b3973.firebaseapp.com',
  projectId: 'xaura-b3973',
  storageBucket: 'xaura-b3973.firebasestorage.app',
  messagingSenderId: '385082739786',
  appId: '1:385082739786:web:14d976abfdeb317defaab3'
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  
  // Determine sound based on user role from payload
  const userRole = payload.data?.userRole
  let soundFile = '/sounds/notification.mp3' // Default fallback
  
  if (userRole === 'Owner') {
    soundFile = '/sounds/owner-notification.mp3.mp3'
  } else if (userRole === 'Worker') {
    soundFile = '/sounds/worker-notification.mp3.mp3'
  } else if (userRole === 'Client') {
    soundFile = '/sounds/client-notification.mp3.mp3'
  }
  
  const notificationTitle = payload.notification?.title || 'New Notification'
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.notificationId || Date.now().toString(),
    data: payload.data || {},
    sound: soundFile
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.')
  
  event.notification.close()

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === '/' && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})


