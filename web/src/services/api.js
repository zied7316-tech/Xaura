import axios from 'axios'
import { API_URL } from '../utils/constants'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('🌐 API: Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token
    })
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('❌ API: Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    console.log('🌐 API: Response received:', {
      url: response.config?.url,
      status: response.status,
      data: response.data
    })
    return response.data
  },
  (error) => {
    console.error('❌ API: Error in response:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data
    })
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    
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

