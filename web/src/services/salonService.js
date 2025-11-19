import api from './api'
import { salonClientService } from './salonClientService'

export const salonService = {
  // Create salon
  createSalon: async (salonData) => {
    const response = await api.post('/salons', salonData)
    return response.data.salon
  },

  // Get salon by ID
  getSalonById: async (id) => {
    const response = await api.get(`/salons/${id}`)
    return response.data.salon
  },

  // Get salon by QR code
  getSalonByQRCode: async (qrCode) => {
    const response = await api.get(`/salons/qr/${qrCode}`)
    return response.data.salon
  },

  // Update salon
  updateSalon: async (id, salonData) => {
    const response = await api.put(`/salons/${id}`, salonData)
    return response.data.salon
  },

  // Add worker to salon
  addWorker: async (salonId, email) => {
    const response = await api.post(`/salons/${salonId}/workers`, { email })
    return response.data.worker
  },

  // Get salon services
  getSalonServices: async (salonId) => {
    const response = await api.get(`/salons/${salonId}/services`)
    return response.data.services
  },

  // Get salon schedule
  getSalonSchedule: async (salonId) => {
    const response = await api.get(`/salons/${salonId}/schedule`)
    return response.data
  },

  // Get QR code image
  getQRCodeImage: async (salonId) => {
    const response = await api.get(`/salons/${salonId}/qr-image`)
    return response.data
  },

  // Get services for the current worker's salon
  getWorkerServices: async () => {
    const response = await api.get('/services/my-services')
    return response.data?.data?.services || response.data?.services || []
  },

  // Get the client's joined salon (returns first salon from my-salons)
  getJoinedSalon: async () => {
    try {
      const mySalons = await salonClientService.getMySalons()
      if (mySalons && mySalons.length > 0) {
        // Return the salon object from the first salon-client relationship
        const salonClient = mySalons[0]
        return salonClient.salonId || salonClient.salon || null
      }
      return null
    } catch (error) {
      console.error('Error getting joined salon:', error)
      return null
    }
  },
}

