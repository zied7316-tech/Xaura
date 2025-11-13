import api from './api'

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
}

