import api from './api'
import { getFCMToken } from './firebaseService'

export const pushNotificationService = {
  // Register FCM token with backend
  registerToken: async (token) => {
    try {
      const response = await api.post('/notifications/register-push-token', {
        token,
        platform: 'web'
      })
      return response.data
    } catch (error) {
      console.error('Error registering push token:', error)
      throw error
    }
  },

  // Unregister FCM token
  unregisterToken: async (token) => {
    try {
      const response = await api.delete('/notifications/unregister-push-token', {
        data: { token }
      })
      return response.data
    } catch (error) {
      console.error('Error unregistering push token:', error)
      throw error
    }
  },

  // Initialize push notifications
  initialize: async () => {
    try {
      const token = await getFCMToken()
      if (token) {
        await pushNotificationService.registerToken(token)
        return { success: true, token }
      }
      return { success: false, message: 'Failed to get FCM token' }
    } catch (error) {
      console.error('Error initializing push notifications:', error)
      return { success: false, error: error.message }
    }
  }
}


