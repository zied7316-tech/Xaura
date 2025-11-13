import api from './api'

export const appointmentManagementService = {
  // Get worker's pending appointments
  getWorkerPendingAppointments: async () => {
    const response = await api.get('/appointment-management/worker/pending')
    return response.data || []
  },

  // Get worker's active/confirmed appointments
  getWorkerActiveAppointments: async () => {
    const response = await api.get('/appointment-management/worker/active')
    return response.data || []
  },

  // Accept appointment (Worker or Owner)
  acceptAppointment: async (appointmentId) => {
    const response = await api.put(`/appointment-management/${appointmentId}/accept`)
    return response.data
  },

  // Reject appointment (Worker or Owner)
  rejectAppointment: async (appointmentId, reason = '') => {
    const response = await api.put(`/appointment-management/${appointmentId}/reject`, { reason })
    return response.data
  },

  // Reassign appointment to another worker (Owner only)
  reassignAppointment: async (appointmentId, newWorkerId) => {
    const response = await api.put(`/appointment-management/${appointmentId}/reassign`, { newWorkerId })
    return response.data
  },

  // Start appointment (Worker only)
  startAppointment: async (appointmentId) => {
    const response = await api.put(`/appointment-management/${appointmentId}/start`)
    return response.data
  },

  // Complete appointment with payment (Worker only)
  completeAppointment: async (appointmentId, paymentData) => {
    const response = await api.put(`/appointment-management/${appointmentId}/complete`, paymentData)
    return response.data
  },

  // Create walk-in appointment (Worker only)
  createWalkInAppointment: async (appointmentData) => {
    const response = await api.post('/appointment-management/walk-in', appointmentData)
    return response.data
  }
}
