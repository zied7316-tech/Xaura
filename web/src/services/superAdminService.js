import api from './api'

export const superAdminService = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/super-admin/dashboard')
    return response // api interceptor already unwraps response.data
  },

  // Get all salons
  getAllSalons: async () => {
    const response = await api.get('/super-admin/salons')
    return response // api interceptor already unwraps response.data
  },

  // Update salon status
  updateSalonStatus: async (salonId, isActive) => {
    const response = await api.put(`/super-admin/salons/${salonId}/status`, { isActive })
    return response // api interceptor already unwraps response.data
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    const response = await api.get('/super-admin/users', { params })
    return response // api interceptor already unwraps response.data
  },

  // Get user details
  getUserDetails: async (userId) => {
    const response = await api.get(`/super-admin/users/${userId}`)
    return response
  },

  // Update user status (ban/unban)
  updateUserStatus: async (userId, isActive) => {
    const response = await api.put(`/super-admin/users/${userId}/status`, { isActive })
    return response
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/super-admin/users/${userId}`)
    return response
  },

  // Get growth analytics
  getGrowthAnalytics: async () => {
    const response = await api.get('/super-admin/analytics/growth')
    return response // api interceptor already unwraps response.data
  },

  // Subscription management
  getAllSubscriptions: async (params = {}) => {
    const response = await api.get('/super-admin/subscriptions', { params })
    return response
  },

  getSubscriptionDetails: async (subscriptionId) => {
    const response = await api.get(`/super-admin/subscriptions/${subscriptionId}`)
    return response
  },

  updateSubscriptionPlan: async (subscriptionId, planData) => {
    const response = await api.put(`/super-admin/subscriptions/${subscriptionId}/plan`, planData)
    return response
  },

  extendTrial: async (subscriptionId, days) => {
    const response = await api.post(`/super-admin/subscriptions/${subscriptionId}/extend-trial`, { days })
    return response
  },

  cancelSubscription: async (subscriptionId) => {
    const response = await api.put(`/super-admin/subscriptions/${subscriptionId}/cancel`)
    return response
  },

  reactivateSubscription: async (subscriptionId) => {
    const response = await api.put(`/super-admin/subscriptions/${subscriptionId}/reactivate`)
    return response
  },

  // Approval endpoints
  getPendingUpgrades: async () => {
    const response = await api.get('/super-admin/subscriptions/pending-upgrades')
    return response
  },

  approveUpgrade: async (subscriptionId) => {
    const response = await api.post(`/super-admin/subscriptions/${subscriptionId}/approve-upgrade`)
    return response
  },

  getPendingWhatsAppPurchases: async () => {
    const response = await api.get('/super-admin/subscriptions/pending-whatsapp')
    return response
  },

  approveWhatsAppPurchase: async (subscriptionId) => {
    const response = await api.post(`/super-admin/subscriptions/${subscriptionId}/approve-whatsapp`)
    return response
  },

  getPendingPixelPurchases: async () => {
    const response = await api.get('/super-admin/subscriptions/pending-pixel')
    return response
  },

  approvePixelPurchase: async (subscriptionId) => {
    const response = await api.post(`/super-admin/subscriptions/${subscriptionId}/approve-pixel`)
    return response
  }
}
