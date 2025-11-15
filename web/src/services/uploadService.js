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

  // Get image URL (for display)
  getImageUrl: (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    
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
    
    return `${baseUrl}${path}`
  }
}

