import api from './api'

export const workerService = {
  // Get all workers
  getWorkers: async () => {
    try {
      const response = await api.get('/workers')
      console.log('WorkerService - Raw response:', response)
      console.log('WorkerService - Response type:', typeof response)
      console.log('WorkerService - Is array?', Array.isArray(response))
      console.log('WorkerService - Response keys:', response ? Object.keys(response) : 'null')
      
      // API interceptor returns response.data, so response structure is:
      // { success: true, count: number, data: { workers: [...] } }
      
      // First check: response.data.workers (most common structure - backend returns this)
      if (response && response.data && response.data.workers && Array.isArray(response.data.workers)) {
        console.log('✅ WorkerService - Found workers in response.data.workers:', response.data.workers.length)
        console.log('WorkerService - Workers:', response.data.workers)
        return response.data.workers
      }
      
      // Second check: response.workers (direct array)
      if (response && Array.isArray(response.workers)) {
        console.log('✅ WorkerService - Found workers in response.workers:', response.workers.length)
        return response.workers
      }
      
      // Third check: response.data is directly an array
      if (response && Array.isArray(response.data)) {
        console.log('✅ WorkerService - Found workers in response.data (array):', response.data.length)
        return response.data
      }
      
      // Fourth check: response is directly an array
      if (Array.isArray(response)) {
        console.log('✅ WorkerService - Response is directly an array:', response.length)
        return response
      }
      
      // Debug: Log the full structure
      console.error('❌ WorkerService - No workers found in response. Full structure:', JSON.stringify(response, null, 2))
      console.warn('WorkerService - Response structure details:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasWorkers: !!response?.data?.workers,
        dataType: response?.data ? typeof response.data : 'undefined',
        dataIsArray: response?.data ? Array.isArray(response.data) : false,
        responseKeys: response ? Object.keys(response) : [],
        dataKeys: response?.data ? Object.keys(response.data) : []
      })
      return []
    } catch (error) {
      console.error('❌ WorkerService - Error fetching workers:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
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

