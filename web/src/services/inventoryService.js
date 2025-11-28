import api from './api'

export const inventoryService = {
  // Get all products
  getProducts: async () => {
    const response = await api.get('/inventory')
    // API interceptor already unwraps response.data, so response is { success, data, stats }
    return response
  },

  // Get products for sale only
  getProductsForSale: async () => {
    const response = await api.get('/inventory/for-sale')
    // API interceptor already unwraps response.data, so response is { success, data, stats }
    return response
  },

  // Get products for use only
  getProductsForUse: async () => {
    const response = await api.get('/inventory/for-use')
    // API interceptor already unwraps response.data, so response is { success, data, stats }
    return response
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await api.get(`/inventory/${productId}`)
    return response.data
  },

  // Get product history
  getProductHistory: async (productId, page = 1, limit = 50) => {
    const response = await api.get(`/inventory/${productId}/history`, {
      params: { page, limit }
    })
    // API interceptor already unwraps response.data, so response is { success, data, pagination }
    return response
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
  restockProduct: async (productId, restockData) => {
    // restockData can be a number (backward compatibility) or an object with quantity and purchaseCost
    const payload = typeof restockData === 'number' 
      ? { quantity: restockData }
      : restockData
    const response = await api.put(`/inventory/${productId}/restock`, payload)
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

  // Worker products for sale
  getWorkerProductsForSale: async () => {
    const response = await api.get('/inventory/worker/products-for-sale')
    // API interceptor already unwraps response.data, so response is { success, data }
    return response
  },

  // Worker products for use
  getWorkerProductsForUse: async () => {
    const response = await api.get('/inventory/worker/products-for-use')
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
