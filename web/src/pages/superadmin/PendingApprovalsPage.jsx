import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  BarChart3,
  AlertCircle,
  DollarSign,
  Calendar
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const PendingApprovalsPage = () => {
  const [pendingUpgrades, setPendingUpgrades] = useState([])
  const [pendingSms, setPendingSms] = useState([])
  const [pendingPixel, setPendingPixel] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upgrades') // upgrades, sms, pixel
  const [approving, setApproving] = useState(null)

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const [upgrades, sms, pixel] = await Promise.all([
        superAdminService.getPendingUpgrades(),
        superAdminService.getPendingSmsPurchases(),
        superAdminService.getPendingPixelPurchases()
      ])
      
      setPendingUpgrades(upgrades.data || [])
      setPendingSms(sms.data || [])
      setPendingPixel(pixel.data || [])
    } catch (error) {
      console.error('Error loading pending requests:', error)
      toast.error('Failed to load pending requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUpgrade = async (subscriptionId) => {
    if (!confirm('Approve this upgrade request? The subscription will be activated immediately.')) return

    setApproving(`upgrade-${subscriptionId}`)
    try {
      await superAdminService.approveUpgrade(subscriptionId)
      toast.success('Upgrade approved and subscription activated!')
      await loadPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve upgrade')
    } finally {
      setApproving(null)
    }
  }

  const handleApproveSms = async (subscriptionId) => {
    if (!confirm('Approve this SMS credits purchase? Credits will be added immediately.')) return

    setApproving(`sms-${subscriptionId}`)
    try {
      await superAdminService.approveSmsPurchase(subscriptionId)
      toast.success('SMS credits approved and added!')
      await loadPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve SMS purchase')
    } finally {
      setApproving(null)
    }
  }

  const handleApprovePixel = async (subscriptionId) => {
    if (!confirm('Approve this Pixel Tracking purchase? Add-on will be activated immediately.')) return

    setApproving(`pixel-${subscriptionId}`)
    try {
      await superAdminService.approvePixelPurchase(subscriptionId)
      toast.success('Pixel Tracking approved and activated!')
      await loadPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve Pixel purchase')
    } finally {
      setApproving(null)
    }
  }

  const getPlanBadge = (plan) => {
    const plans = {
      basic: { label: 'Basic', color: 'bg-green-100 text-green-800' },
      pro: { label: 'Pro', color: 'bg-blue-100 text-blue-800' },
      enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800' }
    }
    const planInfo = plans[plan] || { label: plan, color: 'bg-gray-100 text-gray-800' }
    return <Badge variant="default" className={planInfo.color}>{planInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalPending = pendingUpgrades.length + pendingSms.length + pendingPixel.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-600 mt-1">Review and approve subscription upgrade requests and add-on purchases</p>
        </div>
        {totalPending > 0 && (
          <Badge variant="warning" className="text-lg px-4 py-2">
            {totalPending} Pending
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'upgrades'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Plan Upgrades
            {pendingUpgrades.length > 0 && (
              <Badge variant="warning" className="ml-2">{pendingUpgrades.length}</Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'sms'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            SMS Credits
            {pendingSms.length > 0 && (
              <Badge variant="warning" className="ml-2">{pendingSms.length}</Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pixel')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'pixel'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            Pixel Tracking
            {pendingPixel.length > 0 && (
              <Badge variant="warning" className="ml-2">{pendingPixel.length}</Badge>
            )}
          </div>
        </button>
      </div>

      {/* Pending Upgrades */}
      {activeTab === 'upgrades' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Plan Upgrades ({pendingUpgrades.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUpgrades.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending upgrade requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUpgrades.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-6 border-2 border-yellow-200 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">
                            {sub.salonId?.name || 'Unknown Salon'}
                          </h3>
                          {getPlanBadge(sub.requestedPlan)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Owner</p>
                            <p className="font-medium">{sub.ownerId?.name}</p>
                            <p className="text-sm text-gray-500">{sub.ownerId?.email}</p>
                            <p className="text-sm text-gray-500">{sub.ownerId?.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Request Details</p>
                            <p className="font-semibold text-primary-600">
                              {formatCurrency(sub.requestedPlanPrice || 0)} / {sub.requestedBillingInterval || 'month'}
                            </p>
                            {sub.requestedBillingInterval === 'year' && (
                              <p className="text-xs text-green-600 mt-1">
                                Annual billing (20% discount applied)
                              </p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Payment: {sub.paymentMethod || 'Cash'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(sub.upgradeRequestedAt)}
                            </p>
                          </div>
                        </div>
                        {sub.paymentNote && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Payment Note:</p>
                            <p className="text-sm text-gray-600">{sub.paymentNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => handleApproveUpgrade(sub._id)}
                          loading={approving === `upgrade-${sub._id}`}
                          className="mb-2"
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending SMS Purchases */}
      {activeTab === 'sms' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending SMS Credit Purchases ({pendingSms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingSms.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending SMS credit purchases</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingSms.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageSquare className="text-blue-600" size={24} />
                          <h3 className="font-bold text-lg text-gray-900">
                            {sub.salonId?.name || 'Unknown Salon'}
                          </h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Owner</p>
                            <p className="font-medium">{sub.ownerId?.name}</p>
                            <p className="text-sm text-gray-500">{sub.ownerId?.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Purchase Details</p>
                            <p className="font-semibold text-primary-600">
                              {sub.smsCreditPurchase?.credits || 0} SMS Credits
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: {formatCurrency(sub.smsCreditPurchase?.price || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Payment: {sub.smsCreditPurchase?.paymentMethod || 'Cash'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(sub.smsCreditPurchase?.requestedAt)}
                            </p>
                          </div>
                        </div>
                        {sub.smsCreditPurchase?.paymentNote && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Payment Note:</p>
                            <p className="text-sm text-gray-600">{sub.smsCreditPurchase.paymentNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => handleApproveSms(sub._id)}
                          loading={approving === `sms-${sub._id}`}
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Pixel Purchases */}
      {activeTab === 'pixel' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Pixel Tracking Purchases ({pendingPixel.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPixel.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending Pixel Tracking purchases</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPixel.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-6 border-2 border-purple-200 bg-purple-50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <BarChart3 className="text-purple-600" size={24} />
                          <h3 className="font-bold text-lg text-gray-900">
                            {sub.salonId?.name || 'Unknown Salon'}
                          </h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Owner</p>
                            <p className="font-medium">{sub.ownerId?.name}</p>
                            <p className="text-sm text-gray-500">{sub.ownerId?.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Purchase Details</p>
                            <p className="font-semibold text-primary-600">
                              Pixel Tracking Add-on
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: {formatCurrency(sub.pixelTrackingPurchase?.price || 15)} / month
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Payment: {sub.pixelTrackingPurchase?.paymentMethod || 'Cash'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(sub.pixelTrackingPurchase?.requestedAt)}
                            </p>
                          </div>
                        </div>
                        {sub.pixelTrackingPurchase?.paymentNote && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Payment Note:</p>
                            <p className="text-sm text-gray-600">{sub.pixelTrackingPurchase.paymentNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => handleApprovePixel(sub._id)}
                          loading={approving === `pixel-${sub._id}`}
                        >
                          <CheckCircle size={16} className="mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PendingApprovalsPage

