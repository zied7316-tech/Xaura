import api from './api'

export const subscriptionService = {
  // Get owner's subscription
  getMySubscription: async () => {
    const response = await api.get('/owner/subscription')
    return response
  },

  // Get available plans and add-ons
  getAvailablePlans: async () => {
    const response = await api.get('/owner/subscription/plans')
    return response
  },

  // Confirm trial continuation (at day 15)
  confirmTrial: async () => {
    const response = await api.post('/owner/subscription/confirm-trial')
    return response
  },

  // Request plan upgrade (cash payment)
  requestPlanUpgrade: async (plan, billingInterval, paymentMethod, paymentNote) => {
    const response = await api.post('/owner/subscription/request-upgrade', {
      plan,
      billingInterval: billingInterval || 'month',
      paymentMethod: paymentMethod || 'cash',
      paymentNote
    })
    return response
  },

  // Purchase SMS credits
  purchaseSmsCredits: async (packageType, paymentMethod, paymentNote) => {
    const response = await api.post('/owner/subscription/sms-credits/purchase', {
      packageType,
      paymentMethod: paymentMethod || 'cash',
      paymentNote
    })
    return response
  },

  // Purchase Pixel Tracking add-on
  purchasePixelTracking: async (paymentMethod, paymentNote) => {
    const response = await api.post('/owner/subscription/pixel-tracking/purchase', {
      paymentMethod: paymentMethod || 'cash',
      paymentNote
    })
    return response
  },
}

