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
  ShoppingCart
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import { StatusBadge } from '../../components/ui/Badge'

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [subscriptionData, plansData] = await Promise.all([
        subscriptionService.getMySubscription(),
        subscriptionService.getAvailablePlans()
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
      toast.error('Failed to load subscription data')
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
    if (!selectedPlan) return
    
    setRequesting(true)
    try {
      const response = await subscriptionService.requestPlanUpgrade(
        selectedPlan.id,
        billingInterval,
        'cash',
        paymentNote
      )
      toast.success(response.message || 'Upgrade request submitted successfully!')
      setShowUpgradeModal(false)
      setSelectedPlan(null)
      setPaymentNote('')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit upgrade request')
    } finally {
      setRequesting(false)
    }
  }

  const getPlanPrice = (plan) => {
    if (!plan || !plan.price) return 0
    if (typeof plan.price === 'object') {
      return plan.price[billingInterval] || plan.price.month
    }
    return plan.price
  }

  const getMonthlyEquivalent = (plan) => {
    if (!plan || !plan.price) return 0
    if (typeof plan.price === 'object' && billingInterval === 'year') {
      return plan.price.year / 12
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
          <p className="text-gray-600 mt-1">Manage your subscription, plans, and add-ons</p>
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
                    {formatCurrency(currentPlan.price)} / month
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

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const price = getPlanPrice(plan)
              const monthlyEquivalent = getMonthlyEquivalent(plan)
              const savings = billingInterval === 'year' 
                ? (plan.price?.month || 0) * 12 - price 
                : 0

              return (
                <div
                  key={plan.id}
                  className={`p-6 border-2 rounded-lg transition-all ${
                    currentPlan?.id === plan.id
                      ? getPlanColor(plan.id)
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {getPlanIcon(plan.id)}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <div>
                        <p className="text-2xl font-bold text-primary-600">
                          {formatCurrency(price)}
                          <span className="text-sm font-normal text-gray-500">
                            /{billingInterval === 'year' ? 'year' : 'month'}
                          </span>
                        </p>
                        {billingInterval === 'year' && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(monthlyEquivalent)}/month billed annually
                          </p>
                        )}
                        {savings > 0 && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            Save {formatCurrency(savings)} per year!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                  <Button
                    fullWidth
                    variant={currentPlan?.id === plan.id ? 'outline' : 'primary'}
                    onClick={() => {
                      setSelectedPlan(plan)
                      setShowUpgradeModal(true)
                    }}
                    disabled={currentPlan?.id === plan.id}
                  >
                    {currentPlan?.id === plan.id ? 'Current Plan' : 'Upgrade Now'}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add-ons */}
      {addOns && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* SMS Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                SMS Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Pixel Tracking */}
          {currentPlan?.id !== 'enterprise' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="text-purple-600" size={20} />
                  Pixel Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
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
        title={`Upgrade to ${selectedPlan?.name} Plan`}
      >
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
            >
              Cancel
            </Button>
          </div>
        </div>
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

