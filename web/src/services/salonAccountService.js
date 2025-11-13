import api from './api'

export const salonAccountService = {
  // Create salon account (salon-first registration)
  createSalonAccount: async (salonData) => {
    const response = await api.post('/salon-account/register', salonData)
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.owner))
      localStorage.setItem('salon', JSON.stringify(response.data.salon))
    }
    
    return response.data
  },

  // Get salon account details
  getSalonAccount: async () => {
    const response = await api.get('/salon-account')
    return response.data
  },

  // Update operating mode
  updateOperatingMode: async (mode) => {
    const response = await api.put('/salon-account/mode', { operatingMode: mode })
    return response.data.salon
  },
}

