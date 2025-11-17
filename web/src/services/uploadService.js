import axios from 'axios'
import { API_URL } from '../utils/constants'

export const uploadService = {
  // Upload salon logo
  uploadSalonImage: async (salonId, file) => {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/upload/salon/${salonId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data.data
  },

  // Upload service image
  uploadServiceImage: async (serviceId, file) => {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/upload/service/${serviceId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data.data
  },

  // Upload worker profile picture
  uploadWorkerImage: async (workerId, file) => {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/upload/worker/${workerId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data.data
  },

  // Upload user profile picture (works for all roles: Client, Owner, Worker)
  uploadUserImage: async (userId, file) => {
    const formData = new FormData()
    formData.append('image', file)

    const token = localStorage.getItem('token')
    const response = await axios.post(
      `${API_URL}/upload/user/${userId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    )

    return response.data.data
  },

  // Delete salon logo
  deleteSalonImage: async (salonId) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(
      `${API_URL}/upload/salon/${salonId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Delete service image
  deleteServiceImage: async (serviceId) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(
      `${API_URL}/upload/service/${serviceId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Delete worker profile picture
  deleteWorkerImage: async (workerId) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(
      `${API_URL}/upload/worker/${workerId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Delete user profile picture (works for all roles: Client, Owner, Worker)
  deleteUserImage: async (userId) => {
    const token = localStorage.getItem('token')
    const response = await axios.delete(
      `${API_URL}/upload/user/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    return response.data
  },

  // Get image URL (for display)
  // Handles both Cloudinary URLs (https://) and local storage paths (/uploads/...)
  getImageUrl: (imagePath) => {
    if (!imagePath) {
      return null
    }
    
    // If it's already a full URL (Cloudinary or external), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
    // For local storage paths, construct full URL
    // Extract base URL from API_URL (remove /api)
    // Handle cases like: https://api.xaura.pro/api -> https://api.xaura.pro
    // or http://localhost:5000/api -> http://localhost:5000
    let baseUrl = API_URL
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4) // Remove '/api'
    } else if (baseUrl.includes('/api')) {
      baseUrl = baseUrl.replace('/api', '')
    }
    
    // Ensure imagePath starts with /
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    const fullUrl = `${baseUrl}${path}`
    
    return fullUrl
  }
}

