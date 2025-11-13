import api from './api'

export const reviewService = {
  // Create review
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData)
    return response.data
  },

  // Get worker reviews
  getWorkerReviews: async (workerId) => {
    const response = await api.get(`/reviews/worker/${workerId}`)
    return response.data
  },

  // Get salon reviews
  getSalonReviews: async (salonId) => {
    const response = await api.get(`/reviews/salon/${salonId}`)
    return response.data
  },

  // Get my reviews
  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews')
    return response.data
  },

  // Check if can review appointment
  canReviewAppointment: async (appointmentId) => {
    const response = await api.get(`/reviews/can-review/${appointmentId}`)
    return response.data
  }
}




