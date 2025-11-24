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
    try {
      const response = await api.post('/profile/regenerate-userid')
      console.log('[PROFILE] Regenerate userID response:', response.data)
      
      // Response structure: { success: true, data: { userID: "...", user: {...} } }
      if (response.data && response.data.data) {
        if (response.data.data.user) {
          return response.data.data.user
        }
        // If user is not in data, but we have userID, fetch updated profile
        if (response.data.data.userID) {
          const profileResponse = await api.get('/profile')
          if (profileResponse.data && profileResponse.data.data && profileResponse.data.data.user) {
            return profileResponse.data.data.user
          }
        }
      }
      
      // Fallback: try alternative response structure
      if (response.data && response.data.user) {
        return response.data.user
      }
      
      throw new Error('Unexpected response structure from regenerate userID endpoint')
    } catch (error) {
      console.error('[PROFILE] Error in regenerateUserID:', error)
      console.error('[PROFILE] Error response:', error.response?.data)
      throw error
    }
  }
}

