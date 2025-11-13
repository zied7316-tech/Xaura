import api from './api'

export const customerService = {
  // Get all customers with analytics
  getCustomers: async () => {
    const response = await api.get('/customers')
    return response.data
  },

  // Get single customer details with full history
  getCustomerDetails: async (customerId) => {
    const response = await api.get(`/customers/${customerId}`)
    return response.data
  },

  // Update customer profile
  updateCustomerProfile: async (customerId, profileData) => {
    const response = await api.put(`/customers/${customerId}/profile`, profileData)
    return response.data
  },

  // Add note to customer
  addCustomerNote: async (customerId, noteData) => {
    const response = await api.post(`/customers/${customerId}/notes`, noteData)
    return response.data
  },

  // Get birthday reminders
  getBirthdayReminders: async () => {
    const response = await api.get('/customers/reminders/birthdays')
    return response.data
  }
}
