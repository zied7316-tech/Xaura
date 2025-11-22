import { useState, useEffect } from 'react'
import { subscriptionService } from '../../services/subscriptionService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Zap,
  Crown,
  Gift,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Users,
  Store,
  Calendar,
  DollarSign,
  Package,
  Bell,
  Sparkles,
  Brain,
  Globe,
  FileText,
  Settings,
  Infinity
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import Badge, { StatusBadge } from '../../components/ui/Badge'

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [addOns, setAddOns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [showPixelModal, setShowPixelModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedSmsPackage, setSelectedSmsPackage] = useState(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [billingInterval, setBillingInterval] = useState('month') // 'month' or 'year'
  const [currentPlanIndex, setCurrentPlanIndex] = useState(0) // For carousel

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - please try again')), 25000)
      )
      
      const [subscriptionData, plansData] = await Promise.race([
        Promise.all([
          subscriptionService.getMySubscription(),
          subscriptionService.getAvailablePlans()
        ]),
        timeoutPromise
      ])
      
      setSubscription(subscriptionData.data)
      setPlans(plansData.data.plans || [])
      setAddOns(plansData.data.addOns)
      
      // Show confirmation modal if needed
      if (subscriptionData.needsConfirmation) {
        setShowConfirmationModal(true)
      }
    } catch (error) {
      console.error('Error loading subscription data:', error)
      
      // Better error messages
      if (error.message?.includes('timeout')) {
        toast.error('Request timed out. The server is taking too long to respond. Please try again.')
      } else if (error.response?.status === 404) {
        toast.error('Subscription not found. Please contact support.')
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.')
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to load subscription data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmTrial = async () => {
    setConfirming(true)
    try {
      const response = await subscriptionService.confirmTrial()
      toast.success(response.message || 'Trial confirmed! You received 30 additional free days.')
      setShowConfirmationModal(false)
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm trial')
    } finally {
      setConfirming(false)
    }
  }

  const handleRequestUpgrade = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan first')
      return
    }
    
    if (requesting) {
      return // Prevent double submission
    }
    
    setRequesting(true)
    try {
      console.log('Requesting upgrade:', {
        plan: selectedPlan.id,
        interval: billingInterval,
        paymentMethod: 'cash',
        note: paymentNote
      })
      
      const response = await subscriptionService.requestPlanUpgrade(
        selectedPlan.id,
        billingInterval,
        'cash',
        paymentNote
      )
      
      console.log('Upgrade response:', response)
      
      toast.success(response.message || 'Upgrade request submitted successfully!')
      setShowUpgradeModal(false)
      setSelectedPlan(null)
      setPaymentNote('')
      await loadData()
    } catch (error) {
      console.error('Upgrade error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit upgrade request'
      toast.error(errorMessage)
    } finally {
      setRequesting(false)
    }
  }

  const getPlanPrice = (plan) => {
    if (!plan || !plan.price) return 0
    if (typeof plan.price === 'object' && plan.price !== null) {
      return plan.price[billingInterval] || plan.price.month || 0
    }
    // Ensure it's a number
    const price = Number(plan.price)
    return isNaN(price) ? 0 : price
  }

  const getMonthlyEquivalent = (plan) => {
    if (!plan || !plan.price) return 0
    if (typeof plan.price === 'object' && plan.price !== null && billingInterval === 'year') {
      const yearPrice = Number(plan.price.year) || 0
      return yearPrice / 12
    }
    return getPlanPrice(plan)
  }

  const handlePurchaseSms = async () => {
    if (!selectedSmsPackage) return
    
    setRequesting(true)
    try {
      const response = await subscriptionService.purchaseSmsCredits(
        selectedSmsPackage.credits.toString(),
        'cash',
        paymentNote
      )
      toast.success(response.message || 'SMS credits purchase requested!')
      setShowSmsModal(false)
      setSelectedSmsPackage(null)
      setPaymentNote('')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request SMS credits')
    } finally {
      setRequesting(false)
    }
  }

  const handlePurchasePixel = async () => {
    setRequesting(true)
    try {
      const response = await subscriptionService.purchasePixelTracking('cash', paymentNote)
      toast.success(response.message || 'Pixel Tracking add-on requested!')
      setShowPixelModal(false)
      setPaymentNote('')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request Pixel Tracking')
    } finally {
      setRequesting(false)
    }
  }

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'basic':
        return <CheckCircle className="text-green-600" size={24} />
      case 'pro':
        return <TrendingUp className="text-blue-600" size={24} />
      case 'enterprise':
        return <Crown className="text-purple-600" size={24} />
      default:
        return <CreditCard size={24} />
    }
  }

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'basic':
        return 'border-green-200 bg-green-50'
      case 'pro':
        return 'border-blue-200 bg-blue-50'
      case 'enterprise':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const currentPlan = subscription?.plan 
    ? plans.find(p => p.id === subscription.plan)
    : null

  const isTrial = subscription?.status === 'trial'
  const trialDaysRemaining = subscription?.trialDaysRemaining || 0
  const needsConfirmation = subscription?.needsConfirmation

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Plans</h1>
          <p className="text-gray-600 mt-1">Choose your plan and optional add-ons - purchase only what you need</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {isTrial ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Clock className="text-yellow-600" size={32} />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900">Free Trial Active</h3>
                  <p className="text-yellow-700 text-sm">
                    {trialDaysRemaining} days remaining
                  </p>
                  {needsConfirmation && (
                    <p className="text-yellow-700 text-sm mt-1">
                      Confirm you like the platform to get 30 additional free days!
                    </p>
                  )}
                </div>
                {needsConfirmation && (
                  <Button onClick={() => setShowConfirmationModal(true)}>
                    Confirm Now
                  </Button>
                )}
              </div>
              
              {trialDaysRemaining <= 7 && !needsConfirmation && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    <AlertCircle className="inline mr-2" size={16} />
                    Your trial ends soon. Choose a plan to continue using the platform.
                  </p>
                </div>
              )}
            </div>
          ) : currentPlan ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-4 p-4 border-2 rounded-lg ${getPlanColor(currentPlan.id)}`}>
                {getPlanIcon(currentPlan.id)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{currentPlan.name} Plan</h3>
                  <p className="text-gray-600 text-sm">
                    {formatCurrency(
                      typeof currentPlan.price === 'object' 
                        ? (subscription.billingInterval === 'year' ? currentPlan.price.year : currentPlan.price.month)
                        : (subscription.monthlyFee || subscription.price || currentPlan.price || 0)
                    )} / {subscription.billingInterval === 'year' ? 'year' : 'month'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{currentPlan.description}</p>
                </div>
                <StatusBadge status={subscription.status} />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                <AlertCircle className="inline mr-2" size={16} />
                No active subscription. Please choose a plan.
              </p>
            </div>
          )}

          {/* Add-ons Status */}
          {subscription?.addOns && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-3">Active Add-ons</h4>
              <div className="space-y-2">
                {subscription.addOns.pixelTracking?.active && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="text-purple-600" size={20} />
                      <span className="text-sm font-medium">Pixel Tracking</span>
                    </div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="text-blue-600" size={20} />
                    <span className="text-sm font-medium">SMS Credits</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {subscription.addOns.smsCredits?.balance || 0} credits
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans - Carousel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Available Plans</CardTitle>
            {/* Billing Interval Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingInterval === 'month'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                  billingInterval === 'year'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Carousel Container */}
          <div className="relative">
            {/* Carousel Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentPlanIndex((prev) => (prev === 0 ? plans.length - 1 : prev - 1))}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Previous plan"
              >
                <ChevronLeft size={24} className="text-gray-600" />
              </button>
              
              {/* Plan Indicators */}
              <div className="flex gap-2">
                {plans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPlanIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentPlanIndex
                        ? 'w-8 bg-primary-600'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to plan ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPlanIndex((prev) => (prev === plans.length - 1 ? 0 : prev + 1))}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Next plan"
              >
                <ChevronRight size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Carousel Content */}
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentPlanIndex * 100}%)` }}
              >
                {plans.map((plan) => {
                  const price = getPlanPrice(plan)
                  const monthlyEquivalent = getMonthlyEquivalent(plan)
                  const savings = billingInterval === 'year' 
                    ? (plan.price?.month || 0) * 12 - price 
                    : 0

                  return (
                    <div
                      key={plan.id}
                      className="min-w-full px-2"
                    >
                      <div className={`p-8 border-2 rounded-xl transition-all ${
                        currentPlan?.id === plan.id
                          ? getPlanColor(plan.id)
                          : 'border-gray-200 bg-white'
                      }`}>
                        {/* Plan Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            {getPlanIcon(plan.id)}
                            <div>
                              <h3 className="font-bold text-2xl text-gray-900">{plan.name} Plan</h3>
                              <p className="text-gray-600 mt-1">{plan.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary-600">
                              {formatCurrency(price)}
                              <span className="text-lg font-normal text-gray-500">
                                /{billingInterval === 'year' ? 'year' : 'month'}
                              </span>
                            </p>
                            {billingInterval === 'year' && (
                              <p className="text-sm text-gray-500 mt-1">
                                {formatCurrency(monthlyEquivalent)}/month
                              </p>
                            )}
                            {savings > 0 && (
                              <p className="text-sm text-green-600 font-semibold mt-1">
                                Save {formatCurrency(savings)}/year
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Plan Features - Detailed */}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          {/* Team & Branches */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Users className="text-primary-600" size={20} />
                              Team & Branches
                            </h4>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <Store size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>
                                  {plan.features?.maxLocations === -1 ? (
                                    <><Infinity size={14} className="inline text-primary-600" /> Unlimited Locations</>
                                  ) : (
                                    `${plan.features?.maxLocations || 1} Salon Location${(plan.features?.maxLocations || 1) > 1 ? 's' : ''}`
                                  )}
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Users size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <span>
                                  {plan.features?.maxWorkers === -1 ? (
                                    <><Infinity size={14} className="inline text-primary-600" /> Unlimited Workers</>
                                  ) : (
                                    `Up to ${plan.features?.maxWorkers || 3} Workers`
                                  )}
                                </span>
                              </li>
                              {plan.features?.multiBranchControlPanel && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Multi-branch Control Panel</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Operations */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Calendar className="text-primary-600" size={20} />
                              Operations
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.unlimitedAppointments && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Unlimited Appointments</span>
                                </li>
                              )}
                              {plan.features?.unlimitedServices && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Unlimited Services</span>
                                </li>
                              )}
                              {plan.features?.clientCRM && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Client CRM (history, notes, visits)</span>
                                </li>
                              )}
                              {plan.features?.calendarBooking && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Calendar + Booking Management</span>
                                </li>
                              )}
                              {plan.features?.qrCodeBooking && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>QR-code Booking</span>
                                </li>
                              )}
                              {plan.features?.basicDashboard && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Basic Dashboard Overview</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Finance */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <DollarSign className="text-primary-600" size={20} />
                              Finance
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.fullFinanceSystem && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Full Finance System</span>
                                </li>
                              )}
                              {plan.features?.workerCommissions && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Worker Commissions</span>
                                </li>
                              )}
                              {plan.features?.workerPayments && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Worker Payments</span>
                                </li>
                              )}
                              {plan.features?.revenueTracking && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Revenue Tracking</span>
                                </li>
                              )}
                              {plan.features?.cashCardTracking && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Cash vs Card Tracking</span>
                                </li>
                              )}
                              {plan.features?.advancedFinanceBreakdown && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Advanced Finance Breakdown</span>
                                </li>
                              )}
                              {plan.features?.profitabilityIndicators && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Profitability Indicators</span>
                                </li>
                              )}
                              {plan.features?.workerLeaderboard && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Worker Leaderboard</span>
                                </li>
                              )}
                              {plan.features?.multiBranchFinancialConsolidation && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Multi-branch Financial Consolidation</span>
                                </li>
                              )}
                              {plan.features?.advancedProfitLoss && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Advanced Profit & Loss</span>
                                </li>
                              )}
                              {plan.features?.exportExcelPdf && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Export to Excel / PDF</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Analytics & Reporting */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <TrendingUp className="text-primary-600" size={20} />
                              Analytics & Reporting
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.basicReports && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Basic Reports (appointments, revenue, workers)</span>
                                </li>
                              )}
                              {plan.features?.advancedAnalytics && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Advanced Analytics</span>
                                </li>
                              )}
                              {plan.features?.workerPerformanceDashboard && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Worker Performance Dashboard</span>
                                </li>
                              )}
                              {plan.features?.clientInsights && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Client Insights</span>
                                </li>
                              )}
                              {plan.features?.heatmaps && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Heatmaps: busy hours, peak days</span>
                                </li>
                              )}
                              {plan.features?.revenuePerService && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Revenue per Service</span>
                                </li>
                              )}
                              {plan.features?.revenuePerWorker && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Revenue per Worker</span>
                                </li>
                              )}
                              {plan.features?.aiInsights && (
                                <li className="flex items-start gap-2">
                                  <Brain className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                  <span>AI Insights (retention, predictions, upsell)</span>
                                </li>
                              )}
                              {plan.features?.priceOptimizationAI && (
                                <li className="flex items-start gap-2">
                                  <Brain className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                  <span>Price Optimization AI</span>
                                </li>
                              )}
                              {plan.features?.workerPerformanceAI && (
                                <li className="flex items-start gap-2">
                                  <Brain className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                  <span>Worker Performance AI</span>
                                </li>
                              )}
                              {plan.features?.clientPredictionScoring && (
                                <li className="flex items-start gap-2">
                                  <Brain className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                  <span>Client Prediction Scoring</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Inventory */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Package className="text-primary-600" size={20} />
                              Inventory
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.basicInventory && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Basic Inventory (stock in/out)</span>
                                </li>
                              )}
                              {plan.features?.manualAlerts && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Manual Alerts Only</span>
                                </li>
                              )}
                              {plan.features?.autoAlerts && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Auto Alerts</span>
                                </li>
                              )}
                              {plan.features?.automaticCostCalculation && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Automatic Cost Calculation</span>
                                </li>
                              )}
                              {plan.features?.productUsageInsights && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Product Usage Insights</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Loyalty & Rewards */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Gift className="text-primary-600" size={20} />
                              Loyalty & Rewards
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.loyaltyProgram ? (
                                <>
                                  <li className="flex items-start gap-2">
                                    <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>Loyalty Program PRO (points, rewards, bonus tiers)</span>
                                  </li>
                                  {plan.features?.multiTierLoyaltyLevels && (
                                    <li className="flex items-start gap-2">
                                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                      <span>Multi-tier Loyalty Levels</span>
                                    </li>
                                  )}
                                  {plan.features?.vipSegmentation && (
                                    <li className="flex items-start gap-2">
                                      <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                      <span>VIP Segmentation</span>
                                    </li>
                                  )}
                                  {plan.features?.aiDrivenRewards && (
                                    <li className="flex items-start gap-2">
                                      <Brain className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                      <span>AI-driven Rewards</span>
                                    </li>
                                  )}
                                </>
                              ) : (
                                <li className="flex items-start gap-2">
                                  <XCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-500">Not Included</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Ads Manager */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <BarChart3 className="text-primary-600" size={20} />
                              Ads Manager
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.adsManager ? (
                                <>
                                  {plan.features?.adsManagerBasic && (
                                    <>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Ads Manager (Basic)</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Boost Suggestions</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Basic Campaign Tracking</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Ad Performance Dashboard</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>CTR & CPC Estimation</span>
                                      </li>
                                    </>
                                  )}
                                  {plan.features?.adsManagerPro && (
                                    <>
                                      <li className="flex items-start gap-2">
                                        <Sparkles className="text-purple-600 mt-0.5 flex-shrink-0" size={16} />
                                        <span>Ads Manager PRO</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Multi-platform Integration (FB/IG/Google)</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Budget Optimizer (AI)</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Audience Segmentation</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Smart Retargeting</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Campaign Automation</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>ROI Heatmaps</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Cross-platform Attribution</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Automated Daily Reporting</span>
                                      </li>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Conversion Tracking</span>
                                      </li>
                                    </>
                                  )}
                                  {plan.features?.pixelTracking && (
                                    <>
                                      <li className="flex items-start gap-2">
                                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                        <span>Facebook Pixel / TikTok Pixel / Google Tag</span>
                                      </li>
                                    </>
                                  )}
                                </>
                              ) : (
                                <li className="flex items-start gap-2">
                                  <XCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-500">Not Included</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* Notifications */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Bell className="text-primary-600" size={20} />
                              Notifications
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.inAppNotifications && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>In-App Notifications</span>
                                </li>
                              )}
                              {plan.features?.pushNotifications && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Push Notifications (web + mobile)</span>
                                </li>
                              )}
                              {plan.features?.emailNotifications && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Email Notifications</span>
                                </li>
                              )}
                              {plan.features?.webhooks && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Webhooks</span>
                                </li>
                              )}
                              {plan.features?.smsNotifications && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>SMS (via add-on)</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {/* DevTools & Support */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Settings className="text-primary-600" size={20} />
                              DevTools & Support
                            </h4>
                            <ul className="space-y-2 text-sm">
                              {plan.features?.apiAccess && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Full API Access</span>
                                </li>
                              )}
                              {plan.features?.whiteLabel && (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>White-label Branding</span>
                                </li>
                              )}
                              {plan.features?.prioritySupport ? (
                                <li className="flex items-start gap-2">
                                  <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>Priority Support ({plan.features?.supportResponseTime || '2 hours'})</span>
                                </li>
                              ) : (
                                <li className="flex items-start gap-2">
                                  <XCircle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-500">Standard Support</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-6 pt-6 border-t">
                          <Button
                            fullWidth
                            size="lg"
                            variant={currentPlan?.id === plan.id ? 'outline' : 'primary'}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Upgrade button clicked for plan:', plan)
                              if (!plan || !plan.id) {
                                toast.error('Invalid plan selected')
                                return
                              }
                              setSelectedPlan(plan)
                              setShowUpgradeModal(true)
                            }}
                            disabled={currentPlan?.id === plan.id || requesting}
                          >
                            {currentPlan?.id === plan.id ? (
                              <>
                                <CheckCircle size={18} className="mr-2" />
                                Current Plan
                              </>
                            ) : (
                              <>
                                <CreditCard size={18} className="mr-2" />
                                Upgrade to {plan.name}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional Add-ons */}
      {addOns && (
        <Card className="-mt-16">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Optional Add-ons</CardTitle>
              <Badge variant="default" className="bg-gray-100 text-gray-600 text-xs">
                Optional - Purchase only what you need
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Enhance your plan with optional add-ons. You can purchase these anytime, or skip them if you don't need them.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* SMS Credits */}
              <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-gray-900">SMS Credits</h3>
                  <Badge variant="default" className="bg-blue-50 text-blue-700 text-xs ml-auto">
                    Optional
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Purchase SMS credits for sending reminders and notifications
                </p>
                <div className="space-y-2 mb-4">
                  {addOns.smsCredits?.packages?.map((pkg) => (
                    <div
                      key={pkg.credits}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedSmsPackage(pkg)
                        setShowSmsModal(true)
                      }}
                    >
                      <span className="font-medium">{pkg.credits} SMS</span>
                      <span className="text-primary-600 font-semibold">
                        {formatCurrency(pkg.price)}
                      </span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowSmsModal(true)
                  }}
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Purchase Credits
                </Button>
              </div>

              {/* Pixel Tracking */}
              {currentPlan?.id !== 'enterprise' && (
                <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="text-purple-600" size={20} />
                    <h3 className="font-semibold text-gray-900">Pixel Tracking</h3>
                    <Badge variant="default" className="bg-purple-50 text-purple-700 text-xs ml-auto">
                      Optional
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Track conversions and optimize your ads with Facebook Pixel, TikTok Pixel, and Google Tag
                  </p>
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-primary-600">
                      {formatCurrency(addOns.pixelTracking?.price || 15)}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowPixelModal(true)}
                    disabled={subscription?.addOns?.pixelTracking?.active}
                  >
                    {subscription?.addOns?.pixelTracking?.active ? 'Already Active' : 'Add Pixel Tracking'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Confirmation Modal */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        title="Confirm You Like the Platform"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You've been using Xaura for 15 days! Do you like the platform and want to continue?
          </p>
          <p className="text-sm text-gray-500">
            If you confirm, you'll receive <strong>30 additional free days</strong> to continue exploring all features!
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              onClick={handleConfirmTrial}
              loading={confirming}
            >
              <Gift className="mr-2" size={16} />
              Yes, I Love It!
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowConfirmationModal(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false)
          setSelectedPlan(null)
          setPaymentNote('')
        }}
        title={selectedPlan ? `Upgrade to ${selectedPlan.name} Plan` : 'Upgrade Plan'}
      >
        {selectedPlan ? (
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="font-semibold text-primary-900">
                {formatCurrency(getPlanPrice(selectedPlan) || 0)} / {billingInterval === 'year' ? 'year' : 'month'}
              </p>
              {billingInterval === 'year' && (
                <p className="text-sm text-green-600 font-semibold mt-1">
                  Save 20% with annual billing!
                </p>
              )}
              <p className="text-sm text-primary-700 mt-1">
                Payment will be processed manually via cash payment
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Note (Optional)
              </label>
              <Input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Any additional information..."
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                fullWidth
                onClick={handleRequestUpgrade}
                loading={requesting}
                disabled={requesting}
              >
                Request Upgrade
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowUpgradeModal(false)
                  setSelectedPlan(null)
                  setPaymentNote('')
                }}
                disabled={requesting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading plan details...</p>
          </div>
        )}
      </Modal>

      {/* SMS Purchase Modal */}
      <Modal
        isOpen={showSmsModal}
        onClose={() => {
          setShowSmsModal(false)
          setSelectedSmsPackage(null)
          setPaymentNote('')
        }}
        title="Purchase SMS Credits"
      >
        <div className="space-y-4">
          {!selectedSmsPackage ? (
            <div className="space-y-2">
              {addOns?.smsCredits?.packages?.map((pkg) => (
                <div
                  key={pkg.credits}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedSmsPackage(pkg)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{pkg.credits} SMS Credits</span>
                    <span className="text-primary-600 font-semibold">
                      {formatCurrency(pkg.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="font-semibold text-primary-900">
                  {selectedSmsPackage.credits} SMS Credits
                </p>
                <p className="text-sm text-primary-700 mt-1">
                  Price: {formatCurrency(selectedSmsPackage.price)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Note (Optional)
                </label>
                <Input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Any additional information..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  fullWidth
                  onClick={handlePurchaseSms}
                  loading={requesting}
                >
                  Request Purchase
                </Button>
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setSelectedSmsPackage(null)
                    setPaymentNote('')
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Pixel Tracking Modal */}
      <Modal
        isOpen={showPixelModal}
        onClose={() => {
          setShowPixelModal(false)
          setPaymentNote('')
        }}
        title="Add Pixel Tracking"
      >
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-900">
              {formatCurrency(15)} / month
            </p>
            <p className="text-sm text-purple-700 mt-1">
              Includes: Facebook Pixel, TikTok Pixel, Google Tag, and Conversion Tracking Dashboard
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Note (Optional)
            </label>
            <Input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Any additional information..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              onClick={handlePurchasePixel}
              loading={requesting}
            >
              Request Add-on
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowPixelModal(false)
                setPaymentNote('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SubscriptionPage

