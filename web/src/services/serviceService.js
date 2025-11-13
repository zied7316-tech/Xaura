import api from './api'

export const serviceService = {
  // Create service
  createService: async (serviceData) => {
    const response = await api.post('/services', serviceData)
    return response.data.service
  },

  // Get all services
  getAllServices: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/services${queryString ? `?${queryString}` : ''}`)
    return response.data.services
  },

  // Get service by ID
  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`)
    return response.data.service
  },

  // Update service
  updateService: async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData)
    return response.data.service
  },

  // Delete service
  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`)
    return response
  },
}

