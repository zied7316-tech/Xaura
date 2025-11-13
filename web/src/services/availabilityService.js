import axios from 'axios'
import { API_URL } from '../utils/constants'

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

export const availabilityService = {
  // Worker endpoints
  getMyAvailability: async () => {
    const response = await axios.get(`${API_URL}/availability/my-schedule`, getAuthHeader())
    return response.data.data
  },

  updateMyAvailability: async (data) => {
    const response = await axios.put(`${API_URL}/availability/my-schedule`, data, getAuthHeader())
    return response.data.data
  },

  // Public/Client endpoints
  getAvailableWorkers: async (salonId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(`${API_URL}/availability/salon/${salonId}/workers?${params}`)
    return response.data.data
  },

  getWorkerTimeSlots: async (workerId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(`${API_URL}/availability/worker/${workerId}/slots?${params}`)
    return response.data.data
  }
}

