import api from './api'

export const loyaltyService = {
  // Get loyalty program settings (Owner)
  getLoyaltyProgram: async () => {
    const response = await api.get('/loyalty/program')
    // API interceptor already unwraps response.data, so response is { success, data }
    return response
  },

  // Update loyalty program (Owner)
  updateLoyaltyProgram: async (programData) => {
    const response = await api.put('/loyalty/program', programData)
    // API interceptor already unwraps response.data, so response is { success, data, message }
    return response
  },

  // Get my loyalty points (Client)
  getMyLoyaltyPoints: async (salonId) => {
    const response = await api.get('/loyalty/my-points', { params: { salonId } })
    return response.data
  },

  // Redeem reward (Client)
  redeemReward: async (salonId, rewardId) => {
    const response = await api.post('/loyalty/redeem', { salonId, rewardId })
    return response.data
  }
}




