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

  // Finance Dashboard
  getFinanceDashboard: async (startDate, endDate) => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const queryString = params.toString()
    const response = await api.get(`/finance/dashboard${queryString ? `?${queryString}` : ''}`)
    // API interceptor unwraps response.data, so response is { success: true, data: {...} }
    // Return the inner data object
    return response.data || response
  },

  // Daily Closing
  getDayClosure: async (date) => {
    const response = await api.get(`/day-closure/${date}`)
    return response.data?.data?.closure || null
  },

  closeDay: async (date, actualCash, notes, openingCash) => {
    const response = await api.post('/day-closure/close', {
      date,
      actualCash: actualCash !== null && actualCash !== undefined ? parseFloat(actualCash) : null,
      openingCash: openingCash !== null && openingCash !== undefined ? parseFloat(openingCash) : 0,
      notes
    })
    return response.data
  },

  getDayClosureHistory: async (limit = 30) => {
    const response = await api.get(`/day-closure/history?limit=${limit}`)
    // API interceptor unwraps response.data, so response is { success: true, count: X, data: { closures: [...] } }
    // Return closures array
    const closures = response?.data?.closures || response?.closures || []
    console.log('Day Closure History Response:', { response, closuresCount: closures.length })
    return closures
  },

  // Opening Cash (Fond de Caisse)
  getOpeningCash: async (date) => {
    const queryString = date ? `?date=${date}` : '';
    const response = await api.get(`/opening-cash${queryString}`);
    return response.data;
  },

  setOpeningCash: async (date, amount, notes) => {
    const response = await api.post('/opening-cash', { date, amount, notes });
    return response.data;
  },

  getOpeningCashHistory: async (startDate, endDate, limit = 30) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);
    const response = await api.get(`/opening-cash/history?${params}`);
    // API interceptor unwraps response.data, so response is { success: true, count: X, data: { history: [...] } }
    return response.data?.history || [];
  },
}

