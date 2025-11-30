import api from './api'

export const workerService = {
  // Get all workers
  getWorkers: async () => {
    try {
      const response = await api.get('/workers')
      console.log('WorkerService - Raw response:', response)
      
      // API interceptor returns response.data, so response structure is:
      // { success: true, count: number, data: { workers: [...] } }
      
      // First check: response.data.workers (most common structure)
      if (response && response.data && Array.isArray(response.data.workers)) {
        console.log('WorkerService - Found workers in response.data.workers:', response.data.workers.length)
        return response.data.workers
      }
      
      // Second check: response.workers (direct array)
      if (response && Array.isArray(response.workers)) {
        console.log('WorkerService - Found workers in response.workers:', response.workers.length)
        return response.workers
      }
      
      // Third check: response.data is directly an array
      if (response && Array.isArray(response.data)) {
        console.log('WorkerService - Found workers in response.data (array):', response.data.length)
        return response.data
      }
      
      // Fourth check: response is directly an array
      if (Array.isArray(response)) {
        console.log('WorkerService - Response is directly an array:', response.length)
        return response
      }
      
      // Return empty array if no workers found
      console.warn('WorkerService - No workers found in response. Structure:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasWorkers: !!response?.data?.workers,
        responseKeys: response ? Object.keys(response) : []
      })
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

