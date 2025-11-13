import api from './api'

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

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    // Note: api interceptor already unwraps response.data, so response IS the data
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
}

