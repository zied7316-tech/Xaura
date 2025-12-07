import axios from 'axios'
import { API_URL } from '../utils/constants'

const getAuthHeader = () => ({
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})

export const workerFinanceService = {
  // Worker endpoints
  getWallet: async () => {
    const response = await axios.get(`${API_URL}/worker-finance/wallet`, getAuthHeader())
    return response.data.data
  },

  getPaidEarnings: async () => {
    const response = await axios.get(`${API_URL}/worker-finance/paid-earnings`, getAuthHeader())
    return response.data.data
  },

  getUnpaidEarnings: async () => {
    const response = await axios.get(`${API_URL}/worker-finance/unpaid-earnings`, getAuthHeader())
    return response.data.data
  },

  markEarningAsPaid: async (earningId, paymentMethod = 'cash') => {
    const response = await axios.put(
      `${API_URL}/worker-finance/mark-paid/${earningId}`,
      { paymentMethod },
      getAuthHeader()
    )
    return response.data.data
  },

  getEstimatedEarnings: async () => {
    const response = await axios.get(`${API_URL}/worker-finance/estimated-earnings`, getAuthHeader())
    return response.data.data
  },

  getPaymentHistory: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axios.get(
      `${API_URL}/worker-finance/payment-history?${params}`,
      getAuthHeader()
    )
    return response.data.data
  },

  // Owner endpoints - These require Owner role and will be rejected by backend if called by workers
  getAllWorkersWallets: async () => {
    const response = await axios.get(`${API_URL}/worker-finance/all-wallets`, getAuthHeader())
    return response.data.data
  },

  getWorkerUnpaidEarnings: async (workerId) => {
    const response = await axios.get(
      `${API_URL}/worker-finance/unpaid-earnings/${workerId}`,
      getAuthHeader()
    )
    return response.data.data
  },

  getWorkerPaidEarnings: async (workerId) => {
    const response = await axios.get(
      `${API_URL}/worker-finance/paid-earnings/${workerId}`,
      getAuthHeader()
    )
    return response.data.data
  },

  getWorkerFinancialSummary: async (workerId) => {
    const response = await axios.get(
      `${API_URL}/worker-finance/summary/${workerId}`,
      getAuthHeader()
    )
    return response.data.data
  },

  // SECURITY: Owner-only function - Workers cannot generate invoices
  // Backend enforces this with authorize('Owner') middleware and explicit role checks
  generateInvoice: async (data) => {
    const response = await axios.post(
      `${API_URL}/worker-finance/generate-invoice`,
      data,
      getAuthHeader()
    )
    return response.data.data
  },

  recordEarning: async (data) => {
    const response = await axios.post(
      `${API_URL}/worker-finance/record-earning`,
      data,
      getAuthHeader()
    )
    return response.data.data
  },

  recalculateBalance: async (workerId) => {
    const response = await axios.post(
      `${API_URL}/worker-finance/recalculate-balance/${workerId}`,
      {},
      getAuthHeader()
    )
    return response.data.data
  },

  // Advance endpoints
  giveAdvance: async (data) => {
    const response = await axios.post(
      `${API_URL}/worker-finance/give-advance`,
      data,
      getAuthHeader()
    )
    return response.data.data
  },

  getWorkerAdvances: async (workerId = null) => {
    const url = workerId 
      ? `${API_URL}/worker-finance/advances/${workerId}`
      : `${API_URL}/worker-finance/advances`
    const response = await axios.get(url, getAuthHeader())
    return response.data.data
  }
}

