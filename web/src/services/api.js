import axios from 'axios'
import { API_URL } from '../utils/constants'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 seconds timeout (reduced to fail faster and use offline queue)
  
  // Retry configuration for critical endpoints
  validateStatus: (status) => {
    return status < 500; // Don't throw on 4xx errors, only 5xx
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Something went wrong'
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = 'Request timed out. Please check your connection and try again.'
    } else if (error.response) {
      // Server responded with error status
      message = error.response?.data?.message || error.message || 'Something went wrong'
    } else if (error.request) {
      // Request was made but no response received
      message = 'No response from server. Please check your connection.'
    } else {
      message = error.message || 'Something went wrong'
    }
    
    console.error('[API Error]', {
      message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    })
    
    // If unauthorized, clear token and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    return Promise.reject(new Error(message))
  }
)

export default api

