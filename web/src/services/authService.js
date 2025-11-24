import api from './api'
import axios from 'axios'
import { API_URL } from '../utils/constants'

// Create separate axios instance for login with reasonable timeout
const loginApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20 seconds for login (increased to allow for slow DB connections)
})

// Add request interceptor for login API
loginApi.interceptors.request.use(
  (config) => {
    // No token needed for login
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for login API
loginApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Login failed'
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = 'Login request timed out. Please check your connection and try again.'
    } else if (error.response) {
      message = error.response?.data?.message || error.message || 'Login failed'
    } else if (error.request) {
      message = 'No response from server. Please check your connection.'
    } else {
      message = error.message || 'Login failed'
    }
    
    return Promise.reject(new Error(message))
  }
)

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    // Note: api interceptor already unwraps response.data, so response IS the data
    if (response.token) {
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },

  // Login user - use faster login API instance
  login: async (credentials) => {
    const response = await loginApi.post('/auth/login', credentials)
    // Note: loginApi interceptor already unwraps response.data, so response IS the data
    if (response.token) {
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    // Note: api interceptor already unwraps response.data
    return response.user
  },

  // Verify token
  verifyToken: async (token) => {
    const response = await api.post('/auth/verify-token', { token })
    // Note: api interceptor already unwraps response.data
    return response
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token')
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get('/auth/verify-email', { params: { token } })
    return response
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', { email })
    return response
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response
  },
}

