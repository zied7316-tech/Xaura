import api from './api'

export const profileService = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile')
    // API interceptor already unwraps response.data, so response is { success, data: { user } }
    if (response && response.data && response.data.user) {
      return response.data.user
    }
    // Fallback for different response structure
    if (response && response.user) {
      return response.user
    }
    throw new Error('Unexpected response structure from getProfile endpoint')
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData)
    // API interceptor already unwraps response.data, so response is { success, message, data: { user } }
    if (response && response.data && response.data.user) {
      return response.data.user
    }
    // Fallback for different response structure
    if (response && response.user) {
      return response.user
    }
    throw new Error('Unexpected response structure from updateProfile endpoint')
  },
  
  // Regenerate userID
  regenerateUserID: async () => {
    try {
      const response = await api.post('/profile/regenerate-userid')
      console.log('[PROFILE] Regenerate userID response:', response)
      
      // API interceptor already unwraps response.data, so response is { success, message, data: { userID, user } }
      if (response && response.data) {
        if (response.data.user) {
          return response.data.user
        }
        // If user is not in data, but we have userID, fetch updated profile
        if (response.data.userID) {
          const profileResponse = await api.get('/profile')
          // API interceptor unwraps this too, so profileResponse is { success, data: { user } }
          if (profileResponse && profileResponse.data && profileResponse.data.user) {
            return profileResponse.data.user
          }
        }
      }
      
      // Fallback: try alternative response structure
      if (response && response.user) {
        return response.user
      }
      
      throw new Error('Unexpected response structure from regenerate userID endpoint')
    } catch (error) {
      console.error('[PROFILE] Error in regenerateUserID:', error)
      console.error('[PROFILE] Error response:', error.response?.data)
      throw error
    }
  }
}

