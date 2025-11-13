import api from './api'

export const loyaltyService = {
  // Get loyalty program settings (Owner)
  getLoyaltyProgram: async () => {
    const response = await api.get('/loyalty/program')
    return response.data
  },

  // Update loyalty program (Owner)
  updateLoyaltyProgram: async (programData) => {
    const response = await api.put('/loyalty/program', programData)
    return response.data
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




