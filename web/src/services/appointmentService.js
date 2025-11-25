import api from './api'
import axios from 'axios'
import { API_URL } from '../utils/constants'

export const appointmentService = {
  // Create appointment
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData)
    // After interceptor: response = { success, message, data: { appointment } }
    return response.data?.appointment || response.data || response.appointment
  },

  // Get appointments
  getAppointments: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await api.get(`/appointments${queryString ? `?${queryString}` : ''}`)
      // Note: api interceptor returns response.data, so response IS the JSON object
      // Backend sends: { success, count, data: [...] }
      // After interceptor: response = { success, count, data: [...] }
      console.log('Appointments API response:', response)
      return response.data || response || []
    } catch (error) {
      console.error('Error fetching appointments:', error)
      throw error
    }
  },

  // Get appointment by ID
  getAppointmentById: async (id) => {
    const response = await api.get(`/appointments/${id}`)
    return response.data.appointment
  },

  // Update appointment status
  updateAppointmentStatus: async (id, status) => {
    const response = await api.put(`/appointments/${id}/status`, { status })
    return response.data.appointment
  },

  // Get available time slots
  getAvailableSlots: async (params) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/appointments/available-slots?${queryString}`)
    return response.data
  },

  // Create anonymous appointment (no authentication required)
  createAnonymousAppointment: async (appointmentData) => {
    const response = await axios.post(`${API_URL}/appointments/anonymous`, appointmentData)
    return response.data
  },
}

