import api from './api'

export const profileService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile')
    return response.data.data.user
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData)
    return response.data.data.user
  },
  
  // Regenerate userID
  regenerateUserID: async () => {
    const response = await api.post('/profile/regenerate-userid')
    // Response structure: { success: true, data: { userID: "...", user: {...} } }
    if (response.data && response.data.data && response.data.data.user) {
      return response.data.data.user
    }
    // Fallback: try alternative response structure
    if (response.data && response.data.user) {
      return response.data.user
    }
    throw new Error('Unexpected response structure from regenerate userID endpoint')
  }
}

