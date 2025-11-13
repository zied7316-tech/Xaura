import api from './api'

export const advancedBookingService = {
  // Recurring Appointments
  createRecurringAppointment: async (recurringData) => {
    const response = await api.post('/advanced-booking/recurring', recurringData)
    return response.data
  },

  getRecurringAppointments: async () => {
    const response = await api.get('/advanced-booking/recurring')
    return response.data
  },

  cancelRecurring: async (recurringId) => {
    const response = await api.delete(`/advanced-booking/recurring/${recurringId}`)
    return response.data
  },

  // Group Bookings
  createGroupBooking: async (groupData) => {
    const response = await api.post('/advanced-booking/group', groupData)
    return response.data
  },

  getGroupBookings: async () => {
    const response = await api.get('/advanced-booking/group')
    return response.data
  }
}




