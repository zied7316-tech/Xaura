import axios from 'axios'
import { API_URL } from '../utils/constants'

export const salonSearchService = {
  // Search salons with filters
  searchSalons: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(`${API_URL}/salon-search?${params}`)
    return response.data.data
  },

  // Get salon details
  getSalonDetails: async (salonId) => {
    if (!salonId || salonId === 'undefined' || salonId === 'null') {
      throw new Error('Salon ID is required')
    }
    const response = await axios.get(`${API_URL}/salon-search/${salonId}`)
    return response.data.data
  },

  // Get all cities where salons exist
  getCities: async () => {
    const response = await axios.get(`${API_URL}/salon-search/cities`)
    return response.data.data
  }
}

