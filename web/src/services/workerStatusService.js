import axios from 'axios'
import { API_URL } from '../utils/constants'

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

export const workerStatusService = {
  // Get current status
  getMyStatus: async () => {
    const response = await axios.get(`${API_URL}/worker-status/my-status`, getAuthHeader())
    return response.data.data
  },

  // Toggle status
  toggleStatus: async (status) => {
    const response = await axios.put(
      `${API_URL}/worker-status/toggle`,
      { status },
      getAuthHeader()
    )
    return response.data.data
  },

  // Get all workers status (owner)
  getSalonWorkersStatus: async (salonId) => {
    const response = await axios.get(
      `${API_URL}/worker-status/salon/${salonId}`,
      getAuthHeader()
    )
    return response.data.data
  },

  // Get salon analytics (owner)
  getSalonAnalytics: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(
      `${API_URL}/worker-status/analytics/salon?${params}`,
      getAuthHeader()
    )
    return response.data.data
  },

  // Get worker analytics (owner)
  getWorkerAnalytics: async (workerId, filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(
      `${API_URL}/worker-status/analytics/worker/${workerId}?${params}`,
      getAuthHeader()
    )
    return response.data.data
  }
}

