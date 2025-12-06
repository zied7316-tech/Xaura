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
  const [pendingWhatsApp, setPendingWhatsApp] = useState([])
  const [pendingPixel, setPendingPixel] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, upgrades, whatsapp, pixel
  const [approving, setApproving] = useState(null)

  useEffect(() => {
    loadPendingRequests()
  }, [])

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const [upgrades, whatsapp, pixel] = await Promise.all([
        superAdminService.getPendingUpgrades(),
        superAdminService.getPendingWhatsAppPurchases(),
        superAdminService.getPendingPixelPurchases()
      ])
      
      setPendingUpgrades(upgrades.data || [])
      setPendingWhatsApp(whatsapp.data || [])
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

  const handleApproveWhatsApp = async (subscriptionId) => {
    if (!confirm('Approve this WhatsApp credits purchase? Credits will be added immediately.')) return

    setApproving(`whatsapp-${subscriptionId}`)
    try {
      await superAdminService.approveWhatsAppPurchase(subscriptionId)
      toast.success('WhatsApp credits approved and added!')
      await loadPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve WhatsApp purchase')
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

  // Group all requests by subscription/owner
  const groupedRequests = () => {
    const groups = new Map()
    
    // Add upgrades
    pendingUpgrades.forEach(sub => {
      const key = sub._id.toString()
      if (!groups.has(key)) {
        groups.set(key, {
          subscriptionId: sub._id,
          salonId: sub.salonId,
          ownerId: sub.ownerId,
          upgrade: null,
          sms: null,
          pixel: null
        })
      }
      groups.get(key).upgrade = sub
    })
    
    // Add WhatsApp requests
    pendingWhatsApp.forEach(sub => {
      const key = sub._id.toString()
      if (!groups.has(key)) {
        groups.set(key, {
          subscriptionId: sub._id,
          salonId: sub.salonId,
          ownerId: sub.ownerId,
          upgrade: null,
          whatsapp: null,
          pixel: null
        })
      }
      groups.get(key).whatsapp = sub
    })
    
    // Add Pixel requests
    pendingPixel.forEach(sub => {
      const key = sub._id.toString()
      if (!groups.has(key)) {
        groups.set(key, {
          subscriptionId: sub._id,
          salonId: sub.salonId,
          ownerId: sub.ownerId,
          upgrade: null,
          whatsapp: null,
          pixel: null
        })
      }
      groups.get(key).pixel = sub
    })
    
    return Array.from(groups.values())
  }

  const grouped = groupedRequests()
  const totalPending = pendingUpgrades.length + pendingWhatsApp.length + pendingPixel.length

  const handleApproveAll = async (subscriptionId, hasUpgrade, hasWhatsApp, hasPixel) => {
    if (!confirm('Approve all pending requests for this subscription? This will activate the plan and all add-ons immediately.')) return

    setApproving(`all-${subscriptionId}`)
    try {
      const promises = []
      if (hasUpgrade) promises.push(superAdminService.approveUpgrade(subscriptionId))
      if (hasWhatsApp) promises.push(superAdminService.approveWhatsAppPurchase(subscriptionId))
      if (hasPixel) promises.push(superAdminService.approvePixelPurchase(subscriptionId))
      
      await Promise.all(promises)
      toast.success('All requests approved successfully!')
      await loadPendingRequests()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve some requests')
    } finally {
      setApproving(null)
    }
  }

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
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            All Requests
            {grouped.length > 0 && (
              <Badge variant="warning" className="ml-2">{grouped.length}</Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('upgrades')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
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
          onClick={() => setActiveTab('whatsapp')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'whatsapp'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={18} />
            WhatsApp Credits
            {pendingWhatsApp.length > 0 && (
              <Badge variant="warning" className="ml-2">{pendingWhatsApp.length}</Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('pixel')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
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

      {/* All Requests - Grouped by Owner/Salon */}
      {activeTab === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle>All Pending Requests ({grouped.length})</CardTitle>
            <p className="text-sm text-gray-600 mt-1">All pending requests grouped by owner/salon</p>
          </CardHeader>
          <CardContent>
            {grouped.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => {
                  const hasUpgrade = !!group.upgrade
                  const hasWhatsApp = !!group.whatsapp
                  const hasPixel = !!group.pixel
                  const requestCount = [hasUpgrade, hasWhatsApp, hasPixel].filter(Boolean).length
                  
                  return (
                    <div
                      key={group.subscriptionId}
                      className="p-6 border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900">
                              {group.salonId?.name || 'Unknown Salon'}
                            </h3>
                            <Badge variant="warning" className="text-sm">
                              {requestCount} Request{requestCount > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Owner</p>
                              <p className="font-medium">{group.ownerId?.name}</p>
                              <p className="text-sm text-gray-500">{group.ownerId?.email}</p>
                              <p className="text-sm text-gray-500">{group.ownerId?.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Salon</p>
                              <p className="font-medium">{group.salonId?.name || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        {requestCount > 1 && (
                          <Button
                            onClick={() => handleApproveAll(group.subscriptionId, hasUpgrade, hasWhatsApp, hasPixel)}
                            loading={approving === `all-${group.subscriptionId}`}
                            className="ml-4"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Approve All
                          </Button>
                        )}
                      </div>

                      {/* Requests List */}
                      <div className="space-y-4 mt-4 pt-4 border-t border-primary-200">
                        {/* Upgrade Request */}
                        {hasUpgrade && (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="text-yellow-600" size={20} />
                                  <span className="font-semibold text-gray-900">Plan Upgrade Request</span>
                                  {getPlanBadge(group.upgrade.requestedPlan)}
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">Requested Plan:</p>
                                    <p className="font-semibold text-primary-600">
                                      {formatCurrency(group.upgrade.requestedPlanPrice || 0)} / {group.upgrade.requestedBillingInterval || 'month'}
                                    </p>
                                    {group.upgrade.requestedBillingInterval === 'year' && (
                                      <p className="text-xs text-green-600 mt-1">Annual billing (20% discount)</p>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Payment Method:</p>
                                    <p className="font-medium">{group.upgrade.paymentMethod || 'Cash'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Requested: {formatDate(group.upgrade.upgradeRequestedAt)}
                                    </p>
                                  </div>
                                </div>
                                {group.upgrade.paymentNote && (
                                  <div className="mt-2 p-2 bg-white rounded border border-yellow-300">
                                    <p className="text-xs font-medium text-gray-700">Payment Note:</p>
                                    <p className="text-xs text-gray-600">{group.upgrade.paymentNote}</p>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <Button
                                  onClick={() => handleApproveUpgrade(group.subscriptionId)}
                                  loading={approving === `upgrade-${group.subscriptionId}`}
                                  size="sm"
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* WhatsApp Request */}
                        {hasWhatsApp && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <MessageSquare className="text-blue-600" size={20} />
                                  <span className="font-semibold text-gray-900">WhatsApp Credits Purchase</span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">Package:</p>
                                    <p className="font-semibold text-primary-600">
                                      {group.whatsapp.whatsappCreditPurchase?.credits || 0} WhatsApp Credits
                                    </p>
                                    <p className="text-gray-600">
                                      Price: {formatCurrency(group.whatsapp.whatsappCreditPurchase?.price || 0)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Payment Method:</p>
                                    <p className="font-medium">{group.whatsapp.whatsappCreditPurchase?.paymentMethod || 'Cash'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Requested: {formatDate(group.whatsapp.whatsappCreditPurchase?.requestedAt)}
                                    </p>
                                  </div>
                                </div>
                                {group.whatsapp.whatsappCreditPurchase?.paymentNote && (
                                  <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                                    <p className="text-xs font-medium text-gray-700">Payment Note:</p>
                                    <p className="text-xs text-gray-600">{group.whatsapp.whatsappCreditPurchase.paymentNote}</p>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <Button
                                  onClick={() => handleApproveWhatsApp(group.subscriptionId)}
                                  loading={approving === `whatsapp-${group.subscriptionId}`}
                                  size="sm"
                                  variant="primary"
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pixel Request */}
                        {hasPixel && (
                          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <BarChart3 className="text-purple-600" size={20} />
                                  <span className="font-semibold text-gray-900">Pixel Tracking Add-on</span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">Add-on:</p>
                                    <p className="font-semibold text-primary-600">Pixel Tracking</p>
                                    <p className="text-gray-600">
                                      Price: {formatCurrency(group.pixel.pixelTrackingPurchase?.price || 15)} / month
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Payment Method:</p>
                                    <p className="font-medium">{group.pixel.pixelTrackingPurchase?.paymentMethod || 'Cash'}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Requested: {formatDate(group.pixel.pixelTrackingPurchase?.requestedAt)}
                                    </p>
                                  </div>
                                </div>
                                {group.pixel.pixelTrackingPurchase?.paymentNote && (
                                  <div className="mt-2 p-2 bg-white rounded border border-purple-300">
                                    <p className="text-xs font-medium text-gray-700">Payment Note:</p>
                                    <p className="text-xs text-gray-600">{group.pixel.pixelTrackingPurchase.paymentNote}</p>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <Button
                                  onClick={() => handleApprovePixel(group.subscriptionId)}
                                  loading={approving === `pixel-${group.subscriptionId}`}
                                  size="sm"
                                  variant="primary"
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Pending WhatsApp Purchases */}
      {activeTab === 'whatsapp' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending WhatsApp Credit Purchases ({pendingWhatsApp.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWhatsApp.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <p>No pending WhatsApp credit purchases</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingWhatsApp.map((sub) => (
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
                              {sub.whatsappCreditPurchase?.credits || 0} WhatsApp Credits
                            </p>
                            <p className="text-sm text-gray-600">
                              Price: {formatCurrency(sub.whatsappCreditPurchase?.price || 0)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Payment: {sub.whatsappCreditPurchase?.paymentMethod || 'Cash'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(sub.whatsappCreditPurchase?.requestedAt)}
                            </p>
                          </div>
                        </div>
                        {sub.whatsappCreditPurchase?.paymentNote && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium text-gray-700">Payment Note:</p>
                            <p className="text-sm text-gray-600">{sub.whatsappCreditPurchase.paymentNote}</p>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          onClick={() => handleApproveWhatsApp(sub._id)}
                          loading={approving === `whatsapp-${sub._id}`}
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

