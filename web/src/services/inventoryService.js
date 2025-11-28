import api from './api'

export const inventoryService = {
  // Get all products
  getProducts: async () => {
    const response = await api.get('/inventory')
    // API interceptor already unwraps response.data, so response is { success, data, stats }
    return response
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/inventory/${productId}`)
    return response.data
  },

  // Create new product
  createProduct: async (productData) => {
    const response = await api.post('/inventory', productData)
    return response.data
  },

  // Update product
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/inventory/${productId}`, productData)
    return response.data
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await api.delete(`/inventory/${productId}`)
    return response.data
  },

  // Restock product
  restockProduct: async (productId, quantity) => {
    const response = await api.put(`/inventory/${productId}/restock`, { quantity })
    return response.data
  },

  // Use/consume product
  useProduct: async (productId, quantity) => {
    const response = await api.put(`/inventory/${productId}/use`, { quantity })
    return response.data
  },

  // Get low stock alerts
  getLowStockProducts: async () => {
    const response = await api.get('/inventory/alerts/low-stock')
    return response.data
  },

  // Worker inventory methods
  getWorkerProducts: async () => {
    const response = await api.get('/inventory/worker/products')
    // API interceptor already unwraps response.data, so response is { success, data }
    return response
  },

  workerUseProduct: async (productId, quantity) => {
    const response = await api.put(`/inventory/worker/${productId}/use`, { quantity })
    // API interceptor already unwraps response.data, so response is { success, data, message }
    return response
  },

  workerSellProduct: async (productId, saleData) => {
    const response = await api.post(`/inventory/worker/${productId}/sell`, saleData)
    // API interceptor already unwraps response.data, so response is { success, data, message }
    return response
  }
}
