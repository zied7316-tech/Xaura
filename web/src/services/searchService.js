import api from './api'

export const searchService = {
  // Global search
  globalSearch: async (query) => {
    const response = await api.get('/search', { params: { q: query } })
    return response.data
  }
}




