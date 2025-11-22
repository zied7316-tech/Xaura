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
  CheckCircle, XCircle, Clock, Edit, Ban, Play, RefreshCw
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
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
  const [filters, setFilters] = useState({ status: 'all', plan: 'all' })
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
  }, [filters])

  const loadAvailablePlans = async () => {
    try {
      // Use the subscription service to get available plans
      const data = await subscriptionService.getAvailablePlans()
      if (data.success && data.data) {
        setAvailablePlans(data.data.plans || [])
        setAddOns(data.data.addOns || null)
      }
    } catch (error) {
      console.error('Error loading available plans:', error)
      // Fallback to hardcoded plans if API fails
      setAvailablePlans([])
    }
  }

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      console.log('[SubscriptionsPage] Loading subscriptions with filters:', filters)
      const data = await superAdminService.getAllSubscriptions(filters)
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Status Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700 my-auto">Status:</span>
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

            {/* Plan Filter */}
            <div className="flex gap-2">
              <span className="text-sm font-medium text-gray-700 my-auto">Plan:</span>
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
                {filters.status !== 'all' || filters.plan !== 'all'
                  ? 'No subscriptions match your current filters. Try adjusting your filters.'
                  : 'There are no subscriptions in the system yet. Subscriptions will appear here when salons are created.'}
              </p>
              {(filters.status !== 'all' || filters.plan !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => setFilters({ status: 'all', plan: 'all' })}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Salon</th>
                    <th className="text-left py-3 px-4">Owner</th>
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">MRR</th>
                    <th className="text-left py-3 px-4">Trial End</th>
                    <th className="text-left py-3 px-4">Next Billing</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{sub.salonId?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{sub.salonId?.address?.city || ''}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-900">{sub.ownerId?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{sub.ownerId?.email || ''}</div>
                      </td>
                      <td className="py-3 px-4">{getPlanBadge(sub.plan)}</td>
                      <td className="py-3 px-4">{getStatusBadge(sub.status)}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">{formatCurrency(sub.monthlyFee || 0)}</span>
                        <span className="text-xs text-gray-500">/mo</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {sub.status === 'trial' 
                            ? formatDate(sub.trialEndDate || sub.trial?.extendedEndDate || sub.trial?.endDate) 
                            : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {sub.status === 'active' ? formatDate(sub.currentPeriodEnd) : '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
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
                      </td>
                    </tr>
                  ))}
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
                {/* Show plans from API if available, otherwise fallback to hardcoded */}
                {(availablePlans.length > 0 ? availablePlans : Object.keys(PLAN_PRICING).map(key => ({
                  id: key,
                  name: PLAN_PRICING[key].labelEn || PLAN_PRICING[key].label,
                  price: PLAN_PRICING[key].price
                }))).map((plan) => {
                  const planId = plan.id || plan
                  const planName = plan.name || PLAN_PRICING[planId]?.labelEn || PLAN_PRICING[planId]?.label || planId
                  const planPrice = typeof plan.price === 'object' ? plan.price.month : (plan.price || PLAN_PRICING[planId]?.price?.month || 0)
                  return (
                    <option key={planId} value={planId}>
                      {planName} - {formatCurrency(planPrice)}/month
                    </option>
                  )
                })}
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



