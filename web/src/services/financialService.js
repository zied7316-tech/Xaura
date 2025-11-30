import api from './api'

export const financialService = {
  // Payments
  createPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData)
    return response.data.payment
  },

  getPayments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/payments${queryString ? `?${queryString}` : ''}`)
    return response.data.payments
  },

  getRevenueSummary: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/payments/revenue${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // Expenses
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData)
    return response.data.expense
  },

  getExpenses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/expenses${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  updateExpense: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData)
    return response.data.expense
  },

  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`)
    return response
  },

  // Analytics
  getDashboardAnalytics: async () => {
    const response = await api.get('/analytics/dashboard')
    return response.data
  },

  getAnonymousBookingsAnalytics: async () => {
    const response = await api.get('/analytics/anonymous-bookings')
    // API interceptor already unwraps response.data, so response is { success, data: {...} }
    return response
  },

  getRevenueTrends: async (period = 'month') => {
    const response = await api.get(`/analytics/revenue-trends?period=${period}`)
    return response.data
  },

  getProfitLoss: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const response = await api.get(`/analytics/profit-loss${queryString ? `?${queryString}` : ''}`)
    return response.data
  },

  // Reports
  getDailyReport: async (date) => {
    const response = await api.get(`/reports/daily${date ? `?date=${date}` : ''}`)
    return response.data
  },

  getMonthlyReport: async (year, month) => {
    const response = await api.get(`/reports/monthly?year=${year}&month=${month}`)
    return response.data
  },

  getCustomReport: async (startDate, endDate) => {
    const response = await api.get(`/reports/custom?startDate=${startDate}&endDate=${endDate}`)
    return response.data
  },
}

