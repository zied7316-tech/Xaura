import api from './api'

export const workerService = {
  // Get all workers
  getWorkers: async () => {
    try {
      const response = await api.get('/workers')
      console.log('WorkerService - Raw response:', response)
      // API interceptor already unwraps response.data, so response is { success, count, data: { workers } }
      if (response && response.data && response.data.workers) {
        return response.data.workers
      }
      // Fallback for different response structure
      if (response && response.workers) {
        return response.workers
      }
      // Check if response.data exists but workers is directly in data
      if (response && response.data && Array.isArray(response.data)) {
        return response.data
      }
      // Return empty array if no workers found
      console.warn('WorkerService - No workers found in response:', response)
      return []
    } catch (error) {
      console.error('WorkerService - Error fetching workers:', error)
      throw error
    }
  },

  // Get worker details with performance
  getWorkerDetails: async (id) => {
    const response = await api.get(`/workers/${id}`)
    return response.data
  },

  // Update worker (payment model, status, info)
  updateWorker: async (id, workerData) => {
    const response = await api.put(`/workers/${id}`, workerData)
    return response.data.worker
  },

  // Remove worker from salon
  removeWorker: async (id) => {
    const response = await api.delete(`/workers/${id}`)
    return response
  },

  // Get worker performance
  getWorkerPerformance: async (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/workers/${id}/performance${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // Compare all workers
  compareWorkers: async () => {
    const response = await api.get('/workers/performance/compare')
    return response.data.comparison
  },

  // Check worker availability for a specific appointment time
  checkWorkerAvailability: async (workerId, dateTime, appointmentId = null) => {
    const params = new URLSearchParams({ dateTime })
    if (appointmentId) {
      params.append('appointmentId', appointmentId)
    }
    const response = await api.get(`/workers/${workerId}/check-availability?${params.toString()}`)
    // API interceptor already unwraps response.data, so response is { success, data: {...} }
    return response.data
  },
}

