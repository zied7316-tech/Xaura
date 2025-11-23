/**
 * Subscription Plans Configuration for Tunisia
 * Currency: Tunisian Dinar (TND)
 * 
 * Updated: New pricing and feature structure
 * Trial: 45 days (with confirmation at day 15)
 */

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic',
    nameAr: 'أساسي',
    price: {
      month: 49,
      year: 470.4, // 49 * 12 * 0.8 (20% discount)
    },
    currency: 'TND',
    interval: 'month',
    features: {
      // Team & Branches
      maxLocations: 1,
      maxWorkers: 3,
      
      // Operations
      unlimitedAppointments: true,
      unlimitedServices: true,
      clientCRM: true,
      calendarBooking: true,
      qrCodeBooking: true,
      basicDashboard: true,
      
      // Finance
      fullFinanceSystem: true,
      workerCommissions: true,
      workerPayments: true,
      revenueTracking: true,
      cashCardTracking: true,
      
      // Inventory
      basicInventory: true,
      manualAlerts: true,
      
      // Reporting
      basicReports: true,
      
      // Notifications
      inAppNotifications: true,
      
      // Not Included
      loyaltyProgram: false,
      adsManager: false,
      advancedAnalytics: false,
      aiInsights: false,
      multiLocation: false,
      pixelTracking: false,
      prioritySupport: false,
      whiteLabel: false,
      pushNotifications: false,
      emailNotifications: false,
      apiAccess: false,
    },
    description: 'Perfect for small barbers & beauty salons starting out',
    descriptionAr: 'مثالي للحلاقين الصغار وصالونات التجميل الناشئة',
  },
  
  pro: {
    name: 'Pro',
    nameAr: 'احترافي',
    price: {
      month: 99,
      year: 950.4, // 99 * 12 * 0.8 (20% discount)
    },
    currency: 'TND',
    interval: 'month',
    features: {
      // Everything in Basic
      unlimitedAppointments: true,
      unlimitedServices: true,
      clientCRM: true,
      calendarBooking: true,
      qrCodeBooking: true,
      basicDashboard: true,
      fullFinanceSystem: true,
      workerCommissions: true,
      workerPayments: true,
      revenueTracking: true,
      cashCardTracking: true,
      basicInventory: true,
      inAppNotifications: true,
      
      // Team & Branches (upgraded)
      maxLocations: 3,
      maxWorkers: 10,
      
      // Analytics (new)
      advancedAnalytics: true,
      workerPerformanceDashboard: true,
      clientInsights: true,
      heatmaps: true,
      revenuePerService: true,
      revenuePerWorker: true,
      
      // Finance (upgraded)
      advancedFinanceBreakdown: true,
      profitabilityIndicators: true,
      workerLeaderboard: true,
      
      // Inventory Pro (upgraded)
      autoAlerts: true,
      automaticCostCalculation: true,
      productUsageInsights: true,
      
      // Loyalty (new)
      loyaltyProgram: true,
      loyaltyProgramPro: true,
      
      // Ads Manager Basic (new)
      adsManager: true,
      adsManagerBasic: true,
      boostSuggestions: true,
      basicCampaignTracking: true,
      adPerformanceDashboard: true,
      ctrCpcEstimation: true,
      
      // Notifications (upgraded)
      pushNotifications: true,
      emailNotifications: true,
      
      // Not Included
      pixelTracking: false,
      adsManagerPro: false,
      unlimitedWorkers: false,
      unlimitedBranches: false,
      apiAccess: false,
      whiteLabel: false,
      prioritySupport: false,
      aiInsights: false,
    },
    description: 'For growing salons that want full automation & analytics',
    descriptionAr: 'للصالونات المتنامية التي تريد الأتمتة الكاملة والتحليلات',
  },
  
  enterprise: {
    name: 'Enterprise',
    nameAr: 'مؤسسي',
    price: {
      month: 299,
      year: 2870.4, // 299 * 12 * 0.8 (20% discount)
    },
    currency: 'TND',
    interval: 'month',
    features: {
      // Everything in Pro
      unlimitedAppointments: true,
      unlimitedServices: true,
      clientCRM: true,
      calendarBooking: true,
      qrCodeBooking: true,
      basicDashboard: true,
      fullFinanceSystem: true,
      workerCommissions: true,
      workerPayments: true,
      revenueTracking: true,
      cashCardTracking: true,
      basicInventory: true,
      inAppNotifications: true,
      advancedAnalytics: true,
      workerPerformanceDashboard: true,
      clientInsights: true,
      heatmaps: true,
      revenuePerService: true,
      revenuePerWorker: true,
      advancedFinanceBreakdown: true,
      profitabilityIndicators: true,
      workerLeaderboard: true,
      autoAlerts: true,
      automaticCostCalculation: true,
      productUsageInsights: true,
      loyaltyProgram: true,
      loyaltyProgramPro: true,
      adsManager: true,
      adsManagerBasic: true,
      boostSuggestions: true,
      basicCampaignTracking: true,
      adPerformanceDashboard: true,
      ctrCpcEstimation: true,
      pushNotifications: true,
      emailNotifications: true,
      
      // Team & Branches (unlimited)
      maxLocations: -1, // Unlimited
      maxWorkers: -1, // Unlimited
      multiBranchControlPanel: true,
      
      // AI & Advanced Analytics (new)
      aiInsights: true,
      priceOptimizationAI: true,
      workerPerformanceAI: true,
      clientPredictionScoring: true,
      
      // Ads Manager PRO (new)
      adsManagerPro: true,
      multiPlatformIntegration: true,
      pixelTracking: true,
      facebookPixel: true,
      tiktokPixel: true,
      googleTag: true,
      budgetOptimizerAI: true,
      audienceSegmentation: true,
      smartRetargeting: true,
      campaignAutomation: true,
      roiHeatmaps: true,
      crossPlatformAttribution: true,
      automatedDailyReporting: true,
      conversionTracking: true,
      
      // Finance (upgraded)
      multiBranchFinancialConsolidation: true,
      advancedProfitLoss: true,
      exportExcelPdf: true,
      
      // Loyalty Full (upgraded)
      multiTierLoyaltyLevels: true,
      vipSegmentation: true,
      aiDrivenRewards: true,
      
      // DevTools (new)
      apiAccess: true,
      whiteLabel: true,
      
      // Notifications (upgraded)
      webhooks: true,
      smsNotifications: true, // Via add-on
      
      // Support (upgraded)
      prioritySupport: true,
      supportResponseTime: '2 hours',
    },
    description: 'For large salon chains & beauty franchises',
    descriptionAr: 'لسلاسل الصالونات الكبيرة وامتيازات التجميل',
  },
};

/**
 * Add-ons configuration
 */
const ADD_ONS = {
  smsCredits: {
    name: 'SMS Credits',
    nameAr: 'رصيد الرسائل النصية',
    packages: [
      { credits: 100, price: 5, currency: 'TND' },
      { credits: 500, price: 20, currency: 'TND' },
      { credits: 2000, price: 60, currency: 'TND' },
    ],
    autoRecharge: true,
    deliveryReports: true,
    freeTrial: 50, // New salons get 50 free SMS
  },
  
  pixelTracking: {
    name: 'Pixel Tracking',
    nameAr: 'تتبع البكسل',
    price: 15,
    currency: 'TND',
    interval: 'month',
    features: {
      facebookPixel: true,
      tiktokPixel: true,
      googleTag: true,
      conversionTrackingDashboard: true,
    },
    availableFor: ['pro'], // Available as add-on for PRO plan
    includedIn: ['enterprise'], // Already included in Enterprise
  },
};

/**
 * Trial configuration
 */
const TRIAL_CONFIG = {
  initialTrialDays: 45,
  confirmationDay: 15, // Ask for confirmation at day 15
  extendedTrialDays: 30, // Additional days if confirmed (total 75 days)
  freeSmsCredits: 50, // Free SMS credits for new salons
};

/**
 * Get plan details by name
 */
const getPlanDetails = (planName, interval = 'month') => {
  const plan = SUBSCRIPTION_PLANS[planName.toLowerCase()];
  if (!plan) return null;
  
  // Return plan with price for specified interval
  return {
    ...plan,
    price: typeof plan.price === 'object' ? plan.price[interval] : plan.price,
    interval
  };
};

/**
 * Calculate annual discount (20%)
 */
const calculateAnnualPrice = (monthlyPrice) => {
  return monthlyPrice * 12 * 0.8; // 20% discount
};

/**
 * Get all plans
 */
const getAllPlans = () => {
  return Object.entries(SUBSCRIPTION_PLANS).map(([key, value]) => ({
    id: key,
    name: value.name,
    nameAr: value.nameAr,
    price: value.price, // Object with month and year
    currency: value.currency,
    interval: value.interval,
    features: value.features,
    description: value.description,
    descriptionAr: value.descriptionAr,
  }));
};

/**
 * Get all add-ons
 */
const getAllAddOns = () => {
  return ADD_ONS;
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

/**
 * Create a trial subscription object for a new salon
 * This ensures consistent trial creation across all endpoints
 */
const createTrialSubscription = (salonId, ownerId) => {
  const now = new Date();
  return {
    salonId,
    ownerId,
    plan: null, // No plan during trial
    status: 'trial',
    monthlyFee: 0,
    price: 0,
    currency: 'TND',
    billingInterval: 'month',
    trial: {
      startDate: now,
      endDate: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000),
      confirmationDay: new Date(now.getTime() + TRIAL_CONFIG.confirmationDay * 24 * 60 * 60 * 1000),
      confirmationRequested: false,
      confirmationResponded: false,
      confirmed: false,
      extended: false
    },
    startDate: now,
    currentPeriodStart: now,
    currentPeriodEnd: new Date(now.getTime() + TRIAL_CONFIG.initialTrialDays * 24 * 60 * 60 * 1000),
    // Purchase requests should be null (not set) by default
    smsCreditPurchase: {
      status: null,
      packageType: null,
      credits: null,
      price: null,
      paymentMethod: null,
      paymentNote: null,
      requestedAt: null
    },
    pixelTrackingPurchase: {
      status: null,
      price: null,
      paymentMethod: null,
      paymentNote: null,
      requestedAt: null
    }
  };
};

module.exports = {
  SUBSCRIPTION_PLANS,
  ADD_ONS,
  TRIAL_CONFIG,
  getPlanDetails,
  getAllPlans,
  getAllAddOns,
  formatCurrency,
  calculateAnnualPrice,
  TUNISIA_PAYMENT_METHODS,
  createTrialSubscription,
};
