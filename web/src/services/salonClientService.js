import axios from 'axios'
import { API_URL } from '../utils/constants'

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

export const salonClientService = {
  // Client endpoints
  getMySalons: async () => {
    const response = await axios.get(
      `${API_URL}/salon-clients/my-salons`,
      getAuthHeader()
    )
    return response.data.data
  },

  joinSalonViaQR: async (qrCode) => {
    const response = await axios.post(
      `${API_URL}/qr/join/${qrCode}`,
      {},
      getAuthHeader()
    )
    return response.data
  },

  getSalonInfoByQR: async (qrCode) => {
    const response = await axios.get(`${API_URL}/qr/info/${qrCode}`)
    return response.data.data
  },

  // Owner endpoints
  getSalonClients: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(
      `${API_URL}/salon-clients?${params}`,
      getAuthHeader()
    )
    return response.data.data
  },

  getClientDetails: async (clientId) => {
    const response = await axios.get(
      `${API_URL}/salon-clients/${clientId}`,
      getAuthHeader()
    )
    return response.data.data
  },

  updateClientNotes: async (clientId, notes) => {
    const response = await axios.put(
      `${API_URL}/salon-clients/${clientId}/notes`,
      { notes },
      getAuthHeader()
    )
    return response.data.data
  },

  updateClientStatus: async (clientId, status) => {
    const response = await axios.put(
      `${API_URL}/salon-clients/${clientId}/status`,
      { status },
      getAuthHeader()
    )
    return response.data.data
  }
}

