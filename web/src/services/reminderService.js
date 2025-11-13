import api from './api'

export const reminderService = {
  // Get reminder settings
  getReminderSettings: async () => {
    const response = await api.get('/reminders/settings')
    return response.data
  },

  // Update reminder settings
  updateReminderSettings: async (settings) => {
    const response = await api.put('/reminders/settings', settings)
    return response.data
  },

  // Send manual reminder
  sendManualReminder: async (appointmentId, method) => {
    const response = await api.post(`/reminders/send/${appointmentId}`, { method })
    return response.data
  },

  // Get pending reminders
  getPendingReminders: async () => {
    const response = await api.get('/reminders/pending')
    return response.data
  },

  // Test configuration
  testReminderConfig: async (method, testPhone, testEmail) => {
    const response = await api.post('/reminders/test', { method, testPhone, testEmail })
    return response.data
  }
}




