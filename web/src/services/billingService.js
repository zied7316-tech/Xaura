import api from './api';

const billingService = {
  // Super Admin APIs
  getAllBillingHistory: async (params = {}) => {
    const response = await api.get('/billing/admin/all', { params });
    return response;
  },

  getRevenueStats: async (params = {}) => {
    const response = await api.get('/billing/admin/revenue', { params });
    return response;
  },

  manualCharge: async (subscriptionId) => {
    const response = await api.post(`/billing/admin/charge/${subscriptionId}`);
    return response;
  },

  retryPayment: async (billingId) => {
    const response = await api.post(`/billing/admin/retry/${billingId}`);
    return response;
  },

  markPaymentAsPaid: async (billingId, transactionId, paymentMethod, notes) => {
    const response = await api.post(`/billing/admin/mark-paid/${billingId}`, {
      transactionId,
      paymentMethod,
      notes,
    });
    return response;
  },

  processMonthlyBilling: async () => {
    const response = await api.post('/billing/admin/process-monthly');
    return response;
  },

  // Owner APIs
  getSalonBillingHistory: async (params = {}) => {
    const response = await api.get('/billing/history', { params });
    return response;
  },

  addPaymentMethod: async (paymentMethodId) => {
    const response = await api.post('/billing/payment-method', {
      stripePaymentMethodId: paymentMethodId,
    });
    return response;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/billing/payment-methods');
    return response;
  },

  deletePaymentMethod: async (id) => {
    const response = await api.delete(`/billing/payment-methods/${id}`);
    return response;
  },
};

export default billingService;

