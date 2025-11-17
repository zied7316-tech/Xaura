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
  getImageUrl: (imagePath, options = {}) => {
    if (!imagePath) {
      return null
    }
    
    // If it's already a full URL (Cloudinary or external)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // If it's a Cloudinary URL and we want specific dimensions
      if (imagePath.includes('res.cloudinary.com') && (options.width || options.height)) {
        const width = options.width || 1080
        const height = options.height || 1080
        
        // Cloudinary URL format examples:
        // https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}
        // https://res.cloudinary.com/{cloud}/image/upload/{transform}/v{version}/{public_id}
        
        const uploadIndex = imagePath.indexOf('/image/upload/')
        if (uploadIndex !== -1) {
          const baseUrl = imagePath.substring(0, uploadIndex + '/image/upload'.length)
          const afterUpload = imagePath.substring(uploadIndex + '/image/upload/'.length)
          
          // Check if there's already a transformation (doesn't start with 'v')
          const parts = afterUpload.split('/')
          const firstPart = parts[0] || ''
          
          // If first part starts with 'v' or is empty, it's a version number or public_id
          // Otherwise, it's likely a transformation
          const hasTransform = firstPart && !firstPart.startsWith('v') && !/^\d+$/.test(firstPart)
          
          // Build new transformation
          const newTransform = `w_${width},h_${height},c_fill`
          
          if (hasTransform) {
            // Replace existing transformation
            parts[0] = newTransform
            return `${baseUrl}/${parts.join('/')}`
          } else {
            // Insert new transformation before version/public_id
            return `${baseUrl}/${newTransform}/${afterUpload}`
          }
        }
      }
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

