/**
 * Subscription Plans Configuration for Tunisia
 * Currency: Tunisian Dinar (TND)
 * 
 * Exchange Rate Reference (approximate):
 * 1 USD ≈ 3.1 TND
 */

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    nameAr: 'مجاني',
    price: 0,
    currency: 'TND',
    interval: 'month',
    features: {
      maxWorkers: 1,
      maxServices: 10,
      maxClients: 50,
      basicAnalytics: true,
      advancedAnalytics: false,
      smsReminders: false,
      emailReminders: true,
      loyaltyProgram: false,
      customBranding: false,
      prioritySupport: false,
      multiLocation: false,
    },
    description: 'Perfect for solo professionals',
    descriptionAr: 'مثالي للمحترفين المستقلين',
  },
  basic: {
    name: 'Basic',
    nameAr: 'أساسي',
    price: 90, // ~$29 USD = 90 TND
    currency: 'TND',
    interval: 'month',
    features: {
      maxWorkers: 5,
      maxServices: 50,
      maxClients: 200,
      basicAnalytics: true,
      advancedAnalytics: true,
      smsReminders: true,
      emailReminders: true,
      loyaltyProgram: true,
      customBranding: false,
      prioritySupport: false,
      multiLocation: false,
    },
    description: 'Great for small salons',
    descriptionAr: 'رائع للصالونات الصغيرة',
  },
  professional: {
    name: 'Professional',
    nameAr: 'احترافي',
    price: 250, // ~$79 USD = 250 TND
    currency: 'TND',
    interval: 'month',
    features: {
      maxWorkers: -1, // Unlimited
      maxServices: -1, // Unlimited
      maxClients: -1, // Unlimited
      basicAnalytics: true,
      advancedAnalytics: true,
      smsReminders: true,
      emailReminders: true,
      loyaltyProgram: true,
      customBranding: true,
      prioritySupport: false,
      multiLocation: true,
    },
    description: 'For growing businesses',
    descriptionAr: 'للشركات المتنامية',
  },
  enterprise: {
    name: 'Enterprise',
    nameAr: 'مؤسسي',
    price: 620, // ~$199 USD = 620 TND
    currency: 'TND',
    interval: 'month',
    features: {
      maxWorkers: -1, // Unlimited
      maxServices: -1, // Unlimited
      maxClients: -1, // Unlimited
      basicAnalytics: true,
      advancedAnalytics: true,
      smsReminders: true,
      emailReminders: true,
      loyaltyProgram: true,
      customBranding: true,
      prioritySupport: true,
      multiLocation: true,
      whiteLabel: true,
      apiAccess: true,
      dedicatedSupport: true,
    },
    description: 'For large chains & franchises',
    descriptionAr: 'للسلاسل والامتيازات الكبيرة',
  },
};

/**
 * Get plan details by name
 */
const getPlanDetails = (planName) => {
  return SUBSCRIPTION_PLANS[planName.toLowerCase()] || SUBSCRIPTION_PLANS.free;
};

/**
 * Get all plans
 */
const getAllPlans = () => {
  return Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
    id: key,
    ...value,
  }));
};

/**
 * Format currency for Tunisia
 */
const formatCurrency = (amount, showSymbol = true) => {
  const formatted = amount.toFixed(3); // TND uses 3 decimal places
  return showSymbol ? `${formatted} د.ت` : formatted;
};

/**
 * Payment methods available in Tunisia
 */
const TUNISIA_PAYMENT_METHODS = {
  cash: {
    name: 'نقدا',
    nameEn: 'Cash',
    description: 'دفع نقدي',
    descriptionEn: 'Cash payment',
    icon: '💵',
    available: true,
  },
  bank_transfer: {
    name: 'تحويل بنكي',
    nameEn: 'Bank Transfer',
    description: 'تحويل عبر البنك',
    descriptionEn: 'Direct bank transfer',
    icon: '🏦',
    available: true,
  },
  ccp: {
    name: 'CCP',
    nameEn: 'CCP (Postal Check)',
    description: 'حساب الشيكات البريدية',
    descriptionEn: 'Postal check account',
    icon: '📮',
    available: true,
  },
  d17: {
    name: 'D17',
    nameEn: 'D17',
    description: 'دي 17 - دينار الكتروني',
    descriptionEn: 'D17 - Electronic payment',
    icon: '💳',
    available: true,
  },
  flouci: {
    name: 'Flouci',
    nameEn: 'Flouci',
    description: 'فلوسي - دفع عبر الهاتف',
    descriptionEn: 'Mobile payment',
    icon: '📱',
    available: true,
  },
  cheque: {
    name: 'شيك',
    nameEn: 'Cheque',
    description: 'شيك بنكي',
    descriptionEn: 'Bank cheque',
    icon: '📝',
    available: true,
  },
};

module.exports = {
  SUBSCRIPTION_PLANS,
  getPlanDetails,
  getAllPlans,
  formatCurrency,
  TUNISIA_PAYMENT_METHODS,
};


