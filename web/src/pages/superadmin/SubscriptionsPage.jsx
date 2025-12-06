import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import { subscriptionService } from '../../services/subscriptionService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import {
  Crown, DollarSign, Calendar, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Clock, Edit, Ban, Play, RefreshCw, Search, Filter, X,
  CalendarClock, CreditCard, Hourglass, Check
} from 'lucide-react'
import { formatDate, formatCurrency, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const PLAN_PRICING = {
  basic: { label: 'أساسي - Basic', labelEn: 'Basic', price: { month: 49, year: 470.4 }, color: 'green' },
  pro: { label: 'احترافي - Pro', labelEn: 'Pro', price: { month: 99, year: 950.4 }, color: 'blue' },
  enterprise: { label: 'مؤسسي - Enterprise', labelEn: 'Enterprise', price: { month: 299, year: 2870.4 }, color: 'purple' }
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status: 'all', plan: 'all', paymentStatus: 'all' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubscription, setSelectedSubscription] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showTrialModal, setShowTrialModal] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [trialDays, setTrialDays] = useState(30)
  const [availablePlans, setAvailablePlans] = useState([])
  const [addOns, setAddOns] = useState(null)

  useEffect(() => {
    loadSubscriptions()
    loadAvailablePlans()
  }, [filters, searchTerm])

  const loadAvailablePlans = async () => {
    try {
      // Use the subscription service to get available plans
      const data = await subscriptionService.getAvailablePlans()
      if (data.success && data.data && data.data.plans && data.data.plans.length > 0) {
        setAvailablePlans(data.data.plans)
        setAddOns(data.data.addOns || null)
        console.log('[SubscriptionsPage] Loaded plans from API:', data.data.plans.length)
      } else {
        // Fallback to hardcoded plans
        console.log('[SubscriptionsPage] API returned no plans, using fallback')
        setAvailablePlans([])
      }
    } catch (error) {
      console.error('Error loading available plans:', error)
      // Fallback to hardcoded plans if API fails - empty array triggers fallback in render
      setAvailablePlans([])
    }
  }

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      console.log('[SubscriptionsPage] Loading subscriptions with filters:', filters, 'search:', searchTerm)
      const params = { ...filters }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      const data = await superAdminService.getAllSubscriptions(params)
      console.log('[SubscriptionsPage] Response data:', data)
      console.log('[SubscriptionsPage] Subscriptions array:', data.data)
      console.log('[SubscriptionsPage] Analytics:', data.analytics)
      
      // Handle different response structures
      const subscriptionsList = data.data || data.subscriptions || data || []
      const analyticsData = data.analytics || {
        mrr: 0,
        activeCount: 0,
        trialCount: 0,
        planDistribution: {}
      }
      
      setSubscriptions(Array.isArray(subscriptionsList) ? subscriptionsList : [])
      setAnalytics(analyticsData)
      
      if (subscriptionsList.length === 0) {
        console.log('[SubscriptionsPage] No subscriptions found')
      }
    } catch (error) {
      console.error('[SubscriptionsPage] Error loading subscriptions:', error)
      console.error('[SubscriptionsPage] Error details:', error.message, error.response)
      toast.error(error.message || 'Failed to load subscriptions')
      setSubscriptions([])
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = (subscription) => {
    setSelectedSubscription(subscription)
    setNewPlan(subscription.plan)
    setShowPlanModal(true)
  }

  const handleUpdatePlan = async () => {
    if (!selectedSubscription || !newPlan) return

    try {
      const planPrice = typeof PLAN_PRICING[newPlan]?.price === 'object' 
        ? PLAN_PRICING[newPlan].price.month 
        : PLAN_PRICING[newPlan]?.price || 0
      
      await superAdminService.updateSubscriptionPlan(selectedSubscription._id, {
        plan: newPlan,
        monthlyFee: planPrice
      })
      toast.success('Subscription plan updated successfully')
      setShowPlanModal(false)
      loadSubscriptions()
    } catch (error) {
      toast.error('Failed to update plan')
    }
  }

  const handleExtendTrial = (subscription) => {
    setSelectedSubscription(subscription)
    setTrialDays(30)
    setShowTrialModal(true)
  }

  const handleSubmitExtendTrial = async () => {
    if (!selectedSubscription) return

    try {
      await superAdminService.extendTrial(selectedSubscription._id, trialDays)
      toast.success(`Trial extended by ${trialDays} days`)
      setShowTrialModal(false)
      loadSubscriptions()
    } catch (error) {
      toast.error('Failed to extend trial')
    }
  }

  const handleCancelSubscription = async (subscriptionId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return

    try {
      await superAdminService.cancelSubscription(subscriptionId)
      toast.success('Subscription cancelled')
      loadSubscriptions()
    } catch (error) {
      toast.error('Failed to cancel subscription')
    }
  }

  const handleReactivateSubscription = async (subscriptionId) => {
    try {
      await superAdminService.reactivateSubscription(subscriptionId)
      toast.success('Subscription reactivated')
      loadSubscriptions()
    } catch (error) {
      toast.error('Failed to reactivate subscription')
    }
  }

  const handleMarkPaymentPaid = async (subscription, paymentType) => {
    if (!confirm(`Mark ${paymentType === 'upgrade' ? 'upgrade' : paymentType} payment as received? This will update the payment status to paid.`)) return

    try {
      let response
      if (paymentType === 'upgrade') {
        response = await superAdminService.markUpgradePaymentReceived(subscription._id)
      } else if (paymentType === 'whatsapp') {
        response = await superAdminService.markWhatsAppPaymentReceived(subscription._id)
      } else if (paymentType === 'pixel') {
        response = await superAdminService.markPixelPaymentReceived(subscription._id)
      }

      toast.success('Payment marked as received successfully!')
      loadSubscriptions()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark payment as received')
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      trial: { variant: 'warning', icon: Clock, label: 'Trial' },
      active: { variant: 'success', icon: CheckCircle, label: 'Active' },
      suspended: { variant: 'danger', icon: AlertCircle, label: 'Suspended' },
      cancelled: { variant: 'default', icon: XCircle, label: 'Cancelled' }
    }
    const config = variants[status] || variants.trial
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={14} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (plan) => {
    if (!plan) return <Badge variant="default">Trial</Badge>
    const config = PLAN_PRICING[plan]
    if (!config) return <Badge variant="default">{plan}</Badge>
    return <Badge variant={config.color === 'yellow' ? 'warning' : 'primary'}>{config.labelEn || config.label}</Badge>
  }

  // Helper: Get payment status for a subscription
  const getPaymentStatus = (sub) => {
    // Check upgrade payment status
    if (sub.upgradeStatus === 'approved') {
      if (sub.upgradePaymentReceived) {
        return { status: 'paid', label: 'Approved & Paid', color: 'green', icon: CheckCircle }
      } else {
        return { status: 'approved_unpaid', label: 'Approved but Unpaid', color: 'orange', icon: Hourglass }
      }
    }
    
    if (sub.upgradeStatus === 'pending') {
      return { status: 'waiting', label: 'Waiting Approval', color: 'yellow', icon: Clock }
    }
    
    if (sub.status === 'trial') {
      return { status: 'trial', label: 'Trial (No Payment)', color: 'gray', icon: Clock }
    }
    
    if (sub.status === 'active') {
      if (sub.lastPaymentDate) {
        return { status: 'paid', label: 'Paid', color: 'green', icon: CheckCircle }
      }
      return { status: 'active_unpaid', label: 'Active but Unpaid', color: 'orange', icon: Hourglass }
    }
    
    return { status: 'none', label: 'N/A', color: 'gray', icon: XCircle }
  }

  // Helper: Get payment status badge
  const getPaymentStatusBadge = (sub) => {
    const paymentStatus = getPaymentStatus(sub)
    const Icon = paymentStatus.icon
    return (
      <Badge variant={paymentStatus.color === 'green' ? 'success' : paymentStatus.color === 'orange' ? 'warning' : 'default'}>
        <Icon size={12} className="mr-1" />
        {paymentStatus.label}
      </Badge>
    )
  }

  // Helper: Calculate days remaining
  const getDaysRemaining = (endDate) => {
    if (!endDate) return null
    const now = new Date()
    const end = new Date(endDate)
    const diff = end - now
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage salon subscriptions and billing</p>
        </div>
        <Button
          variant="outline"
          onClick={loadSubscriptions}
          disabled={loading}
          title="Refresh subscriptions"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Revenue Stats */}
      {analytics && subscriptions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.mrr)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.activeCount}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="text-yellow-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Trial Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.trialCount}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="text-primary-600" size={32} />
                <div>
                  <p className="text-sm text-gray-600">Total Subscriptions</p>
                  <p className="text-3xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search by salon name, owner name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <div className="flex gap-2">
                  {['all', 'trial', 'active', 'suspended', 'cancelled'].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={filters.status === status ? 'primary' : 'outline'}
                      onClick={() => setFilters({ ...filters, status })}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Plan Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Plan:</span>
                <div className="flex gap-2">
                  {['all', 'basic', 'pro', 'enterprise'].map((plan) => (
                    <Button
                      key={plan}
                      size="sm"
                      variant={filters.plan === plan ? 'primary' : 'outline'}
                      onClick={() => setFilters({ ...filters, plan })}
                    >
                      {plan === 'all' ? 'All' : PLAN_PRICING[plan]?.labelEn || plan}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(filters.status !== 'all' || filters.plan !== 'all' || searchTerm) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setFilters({ status: 'all', plan: 'all', paymentStatus: 'all' })
                    setSearchTerm('')
                  }}
                  className="ml-auto"
                >
                  <X size={16} className="mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 && !loading ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subscriptions Found</h3>
              <p className="text-gray-600 mb-4">
                {filters.status !== 'all' || filters.plan !== 'all' || filters.paymentStatus !== 'all' || searchTerm
                  ? 'No subscriptions match your current filters or search. Try adjusting your filters.'
                  : 'There are no subscriptions in the system yet. Subscriptions will appear here when salons are created.'}
              </p>
              {(filters.status !== 'all' || filters.plan !== 'all' || filters.paymentStatus !== 'all' || searchTerm) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ status: 'all', plan: 'all', paymentStatus: 'all' })
                    setSearchTerm('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Salon / Owner</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Plan / Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">📅 Trial Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">📅 Plan Period</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">💳 Payment Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">💰 Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const trialStart = sub.trial?.startDate
                    const trialEnd = sub.trial?.extendedEndDate || sub.trial?.endDate
                    const planStart = sub.startDate || sub.currentPeriodStart
                    const planEnd = sub.currentPeriodEnd
                    const paymentStatus = getPaymentStatus(sub)
                    const trialDaysRemaining = trialEnd ? getDaysRemaining(trialEnd) : null
                    const planDaysRemaining = planEnd ? getDaysRemaining(planEnd) : null
                    
                    return (
                      <tr key={sub._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{sub.salonId?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 mt-1">{sub.ownerId?.name || 'N/A'}</div>
                          {sub.ownerId?.email && (
                            <div className="text-xs text-gray-400 mt-1">✉️ {sub.ownerId.email}</div>
                          )}
                          {sub.ownerId?.phone && (
                            <div className="text-xs text-gray-400">📞 {sub.ownerId.phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="mb-2">{getPlanBadge(sub.plan)}</div>
                          <div>{getStatusBadge(sub.status)}</div>
                          {sub.upgradeStatus === 'pending' && (
                            <div className="mt-2">
                              <Badge variant="warning" className="text-xs">
                                <Hourglass size={10} className="mr-1" />
                                Upgrade Requested: {sub.requestedPlan ? PLAN_PRICING[sub.requestedPlan]?.labelEn || sub.requestedPlan : 'N/A'}
                              </Badge>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sub.status === 'trial' || trialStart ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar size={12} />
                                <span className="font-medium">Start:</span>
                                <span>{formatDate(trialStart)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <CalendarClock size={12} />
                                <span className="font-medium">End:</span>
                                <span className={trialDaysRemaining !== null && trialDaysRemaining < 7 ? 'text-red-600 font-semibold' : ''}>
                                  {formatDate(trialEnd)}
                                </span>
                              </div>
                              {trialDaysRemaining !== null && (
                                <div className={`text-xs font-semibold ${trialDaysRemaining < 7 ? 'text-red-600' : trialDaysRemaining < 15 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {trialDaysRemaining > 0 ? `${trialDaysRemaining} days left` : 'Expired'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">Trial ended</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sub.status === 'active' && planStart ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Calendar size={12} />
                                <span className="font-medium">Start:</span>
                                <span>{formatDate(planStart)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <CalendarClock size={12} />
                                <span className="font-medium">End:</span>
                                <span>{formatDate(planEnd)}</span>
                              </div>
                              {planDaysRemaining !== null && (
                                <div className="text-xs font-semibold text-blue-600">
                                  {planDaysRemaining > 0 ? `${planDaysRemaining} days left` : 'Expired'}
                                </div>
                              )}
                              {sub.lastPaymentDate && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Last paid: {formatDate(sub.lastPaymentDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              {sub.status === 'trial' ? 'Will start after trial' : 'N/A'}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-2">
                            {getPaymentStatusBadge(sub)}
                            {sub.upgradeStatus === 'pending' && (
                              <div className="text-xs text-orange-600 mt-1">
                                <div>⏳ Requested: {formatDate(sub.upgradeRequestedAt)}</div>
                                {sub.paymentMethod && (
                                  <div>Method: {sub.paymentMethod}</div>
                                )}
                                {sub.requestedPlanPrice && (
                                  <div>Amount: {formatCurrency(sub.requestedPlanPrice)}</div>
                                )}
                              </div>
                            )}
                            {sub.upgradeStatus === 'approved' && !sub.upgradePaymentReceived && (
                              <div className="text-xs text-orange-600 mt-1 space-y-1">
                                <div className="font-semibold">⚠️ Approved but Unpaid</div>
                                <div>Method: {sub.paymentMethod || 'Not specified'}</div>
                                <div>Amount: {formatCurrency(sub.requestedPlanPrice || sub.monthlyFee || 0)}</div>
                                {sub.upgradeRequestedAt && (
                                  <div>Approved: {formatDate(sub.upgradeRequestedAt)}</div>
                                )}
                              </div>
                            )}
                            {sub.upgradeStatus === 'approved' && sub.upgradePaymentReceived && (
                              <div className="text-xs text-green-600 mt-1">
                                <div>✅ Paid: {formatDate(sub.upgradePaymentReceivedAt)}</div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-green-600">{formatCurrency(sub.monthlyFee || 0)}</span>
                            <span className="text-xs text-gray-500">/mo</span>
                          </div>
                          {sub.requestedPlanPrice && sub.upgradeStatus === 'pending' && (
                            <div className="text-xs text-orange-600 mt-1">
                              Requested: {formatCurrency(sub.requestedPlanPrice)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                        <div className="flex flex-col items-end gap-2">
                          {/* Mark Payment as Paid Button */}
                          {sub.upgradeStatus === 'approved' && !sub.upgradePaymentReceived && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleMarkPaymentPaid(sub, 'upgrade')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              title="Mark Payment as Received"
                            >
                              <CreditCard size={14} className="mr-1" />
                              Mark Paid
                            </Button>
                          )}
                          
                          {/* Other Actions */}
                          <div className="flex items-center gap-2">
                            {sub.status !== 'cancelled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChangePlan(sub)}
                                  title="Change Plan"
                                >
                                  <Edit size={16} />
                                </Button>
                                {sub.status === 'trial' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExtendTrial(sub)}
                                    title="Extend Trial"
                                  >
                                    <Clock size={16} />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelSubscription(sub._id)}
                                  className="text-red-600 hover:bg-red-50"
                                  title="Cancel"
                                >
                                  <Ban size={16} />
                                </Button>
                              </>
                            )}
                            {sub.status === 'cancelled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReactivateSubscription(sub._id)}
                                className="text-green-600 hover:bg-green-50"
                                title="Reactivate"
                              >
                                <Play size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Modal */}
      {showPlanModal && selectedSubscription && (
        <Modal
          isOpen={showPlanModal}
          onClose={() => {
            setShowPlanModal(false)
            setSelectedSubscription(null)
          }}
          title="Change Subscription Plan"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Current Plan: <strong>{PLAN_PRICING[selectedSubscription.plan]?.label}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Salon: <strong>{selectedSubscription.salonId?.name}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Plan
              </label>
              <Select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
              >
                <option value="">Select plan...</option>
                {/* Always show plans - use API if available, otherwise use hardcoded PLAN_PRICING */}
                {(() => {
                  // If we have plans from API, use them
                  if (availablePlans.length > 0) {
                    return availablePlans.map((plan) => {
                      const planId = plan.id || plan
                      const planName = plan.name || plan.nameAr || PLAN_PRICING[planId]?.labelEn || PLAN_PRICING[planId]?.label || planId
                      const planPrice = typeof plan.price === 'object' ? plan.price.month : (plan.price || PLAN_PRICING[planId]?.price?.month || 0)
                      return (
                        <option key={planId} value={planId}>
                          {planName} - {formatCurrency(planPrice)}/month
                        </option>
                      )
                    })
                  }
                  // Fallback to hardcoded plans
                  return Object.keys(PLAN_PRICING).map((key) => {
                    const plan = PLAN_PRICING[key]
                    const planName = plan.labelEn || plan.label || key
                    const planPrice = typeof plan.price === 'object' ? plan.price.month : (plan.price || 0)
                    return (
                      <option key={key} value={key}>
                        {planName} - {formatCurrency(planPrice)}/month
                      </option>
                    )
                  })
                })()}
              </Select>
            </div>

            {/* Add-ons Section */}
            {addOns && (
              <div className="mt-6 pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Available Add-ons
                </label>
                <div className="space-y-3">
                  {/* SMS Credits */}
                  {addOns.smsCredits && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{addOns.smsCredits.name}</p>
                          <p className="text-sm text-gray-600">{addOns.smsCredits.nameAr}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Packages: {addOns.smsCredits.packages?.map(p => `${p.credits} SMS - ${formatCurrency(p.price)}`).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pixel Tracking */}
                  {addOns.pixelTracking && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{addOns.pixelTracking.name}</p>
                          <p className="text-sm text-gray-600">{addOns.pixelTracking.nameAr}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(addOns.pixelTracking.price || 15)} / {addOns.pixelTracking.interval || 'month'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Add-ons can be purchased separately by salon owners from their subscription page.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPlanModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePlan}
                disabled={!newPlan || newPlan === selectedSubscription.plan}
              >
                Update Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Extend Trial Modal */}
      {showTrialModal && selectedSubscription && (
        <Modal
          isOpen={showTrialModal}
          onClose={() => {
            setShowTrialModal(false)
            setSelectedSubscription(null)
          }}
          title="Extend Trial Period"
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Salon: <strong>{selectedSubscription.salonId?.name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Current Trial End: <strong>{formatDate(selectedSubscription.trial?.extendedEndDate || selectedSubscription.trial?.endDate)}</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (days)
              </label>
              <Input
                type="number"
                min="1"
                max="365"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTrialModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmitExtendTrial}>
                Extend Trial
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Plan Distribution */}
      {analytics && analytics.planDistribution && subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.planDistribution).map(([plan, count]) => (
                <div key={plan} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{PLAN_PRICING[plan]?.label || plan}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">
                    {((count / subscriptions.length) * 100).toFixed(0)}% of total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SubscriptionsPage



