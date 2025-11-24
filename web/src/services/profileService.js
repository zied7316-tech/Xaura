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
    return response.data.data.user
  }
}

