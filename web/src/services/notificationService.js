import api from './api'

export const notificationService = {
  // Get user's notifications
  getNotifications: async (limit = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', {
      params: { limit, unreadOnly }
    })
    return response.data
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`)
    return response.data
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all')
    return response.data
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`)
    return response.data
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await api.delete('/notifications/clear-all')
    return response.data
  }
}
