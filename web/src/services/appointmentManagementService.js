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
    // API interceptor already unwraps response.data, so response IS the data
    return response
  },

  // Worker quick fix: Edit walk-in appointment (within 15 minutes)
  editWalkInAppointment: async (appointmentId, appointmentData) => {
    const response = await api.put(`/appointment-management/walk-in/${appointmentId}/edit`, appointmentData)
    return response.data
  },

  // Worker quick fix: Delete walk-in appointment (within 15 minutes)
  deleteWalkInAppointment: async (appointmentId) => {
    const response = await api.delete(`/appointment-management/walk-in/${appointmentId}`)
    return response.data
  },

  // Owner override: Edit walk-in appointment (no time limit)
  editWalkInAppointmentOwner: async (appointmentId, appointmentData) => {
    const response = await api.put(`/appointment-management/walk-in/${appointmentId}/edit-owner`, appointmentData)
    return response.data
  },

  // Owner override: Void walk-in appointment (no time limit)
  voidWalkInAppointment: async (appointmentId, reason) => {
    const response = await api.delete(`/appointment-management/walk-in/${appointmentId}/void`, {
      data: { reason }
    })
    return response.data
  },

  // Get worker adjustment history
  getWorkerAdjustments: async (startDate, endDate, limit = 50) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('limit', limit)
    const response = await api.get(`/appointment-management/adjustments?${params}`)
    return response.data?.data || []
  }
}
