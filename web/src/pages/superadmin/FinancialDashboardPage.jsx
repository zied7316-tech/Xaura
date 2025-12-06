import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  DollarSign, TrendingUp, CreditCard, AlertCircle,
  CheckCircle, RefreshCw, Search, Filter, X, Calendar,
  Building, BarChart3, FileText, Download, Eye, Store,
  MessageSquare, BarChart, PieChart, TrendingDown, Repeat
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart as RechartsBarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts'

const FinancialDashboardPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview') // overview, transactions, salons, trends
  const [loading, setLoading] = useState(true)
  
  // Overview data
  const [overview, setOverview] = useState(null)
  
  // Transactions data
  const [transactions, setTransactions] = useState([])
  const [transactionFilters, setTransactionFilters] = useState({
    salonId: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 50
  })
  const [transactionPagination, setTransactionPagination] = useState(null)
  
  // Salons financial summary
  const [salonsFinancial, setSalonsFinancial] = useState([])
  const [salonSearch, setSalonSearch] = useState('')
  
  // Revenue trends
  const [revenueTrends, setRevenueTrends] = useState([])
  
  // Selected salon for detail view
  const [selectedSalon, setSelectedSalon] = useState(null)
  const [salonHistory, setSalonHistory] = useState(null)
  const [showSalonModal, setShowSalonModal] = useState(false)

  useEffect(() => {
    loadOverview()
    if (activeTab === 'transactions') {
      loadTransactions()
    } else if (activeTab === 'salons') {
      loadSalonsFinancial()
    } else if (activeTab === 'trends') {
      loadRevenueTrends()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions()
    }
  }, [transactionFilters])

  useEffect(() => {
    if (activeTab === 'salons') {
      loadSalonsFinancial()
    }
  }, [salonSearch])

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await superAdminService.getFinancialOverview()
      setOverview(data.data)
    } catch (error) {
      console.error('Error loading financial overview:', error)
      toast.error('Failed to load financial overview')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const params = { ...transactionFilters }
      const data = await superAdminService.getAllTransactions(params)
      setTransactions(data.data.transactions || [])
      setTransactionPagination(data.data.pagination)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const loadSalonsFinancial = async () => {
    try {
      setLoading(true)
      const params = salonSearch ? { search: salonSearch } : {}
      const data = await superAdminService.getSalonsFinancialSummary(params)
      setSalonsFinancial(data.data.salons || [])
    } catch (error) {
      console.error('Error loading salons financial:', error)
      toast.error('Failed to load salons financial data')
    } finally {
      setLoading(false)
    }
  }

  const loadRevenueTrends = async () => {
    try {
      setLoading(true)
      const data = await superAdminService.getRevenueTrends({ period: 'monthly', months: 12 })
      setRevenueTrends(data.data.trends || [])
    } catch (error) {
      console.error('Error loading revenue trends:', error)
      toast.error('Failed to load revenue trends')
    } finally {
      setLoading(false)
    }
  }

  const loadSalonHistory = async (salonId) => {
    try {
      const data = await superAdminService.getSalonFinancialHistory(salonId)
      setSalonHistory(data.data)
      setShowSalonModal(true)
    } catch (error) {
      console.error('Error loading salon history:', error)
      toast.error('Failed to load salon financial history')
    }
  }

  const getTransactionTypeBadge = (type) => {
    const types = {
      plan_upgrade: { label: 'Plan Upgrade', color: 'blue' },
      whatsapp_credits: { label: 'WhatsApp Credits', color: 'green' },
      pixel_tracking: { label: 'Pixel Tracking', color: 'purple' },
      recurring_billing: { label: 'Recurring Billing', color: 'orange' }
    }
    const config = types[type] || { label: type, color: 'gray' }
    return <Badge variant={config.color}>{config.label}</Badge>
  }

  const getStatusBadge = (status) => {
    const variants = {
      paid: { variant: 'success', label: 'Paid' },
      unpaid: { variant: 'warning', label: 'Unpaid' },
      pending: { variant: 'default', label: 'Pending' },
      succeeded: { variant: 'success', label: 'Paid' },
      failed: { variant: 'danger', label: 'Failed' }
    }
    const config = variants[status] || { variant: 'default', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  if (loading && !overview) {
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
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Complete financial tracking and analytics for all salon activities</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadOverview()
            if (activeTab === 'transactions') loadTransactions()
            else if (activeTab === 'salons') loadSalonsFinancial()
            else if (activeTab === 'trends') loadRevenueTrends()
          }}
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={18} />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            Transaction History
          </div>
        </button>
        <button
          onClick={() => setActiveTab('salons')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'salons'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Store size={18} />
            Salons Summary
          </div>
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'trends'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Revenue Trends
          </div>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <>
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(overview.totalRevenue || 0)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{overview.totalTransactions || 0} transactions</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outstanding Payments</p>
                    <p className="text-3xl font-bold text-orange-600">{formatCurrency(overview.outstanding?.amount || 0)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{overview.outstanding?.count || 0} unpaid items</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Building className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subscription Revenue</p>
                    <p className="text-3xl font-bold text-purple-600">{formatCurrency(overview.revenueByCategory?.subscriptions || 0)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{overview.transactionsByCategory?.subscriptions || 0} plan payments</p>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Add-ons Revenue</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {formatCurrency((overview.revenueByCategory?.whatsappCredits || 0) + (overview.revenueByCategory?.pixelTracking || 0))}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {(overview.transactionsByCategory?.whatsappCredits || 0) + (overview.transactionsByCategory?.pixelTracking || 0)} add-on purchases
                </p>
              </div>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Subscription Plans</p>
                        <p className="text-xs text-gray-500">{overview.transactionsByCategory?.subscriptions || 0} transactions</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(overview.revenueByCategory?.subscriptions || 0)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <MessageSquare className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">WhatsApp Credits</p>
                        <p className="text-xs text-gray-500">{overview.transactionsByCategory?.whatsappCredits || 0} transactions</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(overview.revenueByCategory?.whatsappCredits || 0)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pixel Tracking</p>
                        <p className="text-xs text-gray-500">{overview.transactionsByCategory?.pixelTracking || 0} transactions</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(overview.revenueByCategory?.pixelTracking || 0)}</p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Repeat className="text-orange-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Recurring Billing</p>
                        <p className="text-xs text-gray-500">{overview.transactionsByCategory?.recurringBilling || 0} transactions</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(overview.revenueByCategory?.recurringBilling || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Outstanding Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">Total Outstanding</p>
                      <AlertCircle className="text-orange-600" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-orange-600">{formatCurrency(overview.outstanding?.amount || 0)}</p>
                    <p className="text-sm text-gray-600 mt-1">{overview.outstanding?.count || 0} items awaiting payment</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Plan Upgrades</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">{overview.outstanding?.breakdown?.upgrades || 0}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(overview.outstanding?.breakdown?.upgradeAmount || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">WhatsApp Credits</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">{overview.outstanding?.breakdown?.whatsapp || 0}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(overview.outstanding?.breakdown?.whatsappAmount || 0)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Pixel Tracking</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="warning">{overview.outstanding?.breakdown?.pixel || 0}</Badge>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(overview.outstanding?.breakdown?.pixelAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Salon</label>
                  <Input
                    type="text"
                    placeholder="Salon name..."
                    value={transactionFilters.salonId}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, salonId: e.target.value, page: 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={transactionFilters.type}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, type: e.target.value, page: 1 })}
                  >
                    <option value="">All Types</option>
                    <option value="plan_upgrade">Plan Upgrade</option>
                    <option value="whatsapp_credits">WhatsApp Credits</option>
                    <option value="pixel_tracking">Pixel Tracking</option>
                    <option value="recurring_billing">Recurring Billing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={transactionFilters.status}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, status: e.target.value, page: 1 })}
                  >
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={transactionFilters.startDate}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, startDate: e.target.value, page: 1 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <Input
                    type="date"
                    value={transactionFilters.endDate}
                    onChange={(e) => setTransactionFilters({ ...transactionFilters, endDate: e.target.value, page: 1 })}
                  />
                </div>
              </div>
              {(transactionFilters.type || transactionFilters.status || transactionFilters.startDate || transactionFilters.endDate || transactionFilters.salonId) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTransactionFilters({ salonId: '', type: '', status: '', startDate: '', endDate: '', page: 1, limit: 50 })}
                >
                  <X size={16} className="mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Transactions Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                <p className="text-gray-600">No transactions match your current filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Salon</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Details</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Payment Method</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">{formatDate(tx.date)}</div>
                            {tx.paidAt && (
                              <div className="text-xs text-gray-500">Paid: {formatDate(tx.paidAt)}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{tx.salonName || 'N/A'}</div>
                            {tx.ownerName && (
                              <div className="text-xs text-gray-500">{tx.ownerName}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">{getTransactionTypeBadge(tx.type)}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">
                              {tx.plan && <div>Plan: <span className="font-medium">{tx.plan}</span></div>}
                              {tx.credits && <div>Credits: <span className="font-medium">{tx.credits}</span></div>}
                              {tx.billingInterval && <div className="text-xs text-gray-500">{tx.billingInterval}</div>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-green-600">{formatCurrency(tx.amount || 0)}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{tx.paymentMethod || 'N/A'}</span>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {transactionPagination && transactionPagination.pages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Page {transactionPagination.page} of {transactionPagination.pages} ({transactionPagination.total} total)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTransactionFilters({ ...transactionFilters, page: transactionFilters.page - 1 })}
                        disabled={transactionFilters.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTransactionFilters({ ...transactionFilters, page: transactionFilters.page + 1 })}
                        disabled={transactionFilters.page >= transactionPagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Salons Summary Tab */}
      {activeTab === 'salons' && (
        <Card>
          <CardHeader>
            <CardTitle>Salons Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by salon name, owner name, or email..."
                  value={salonSearch}
                  onChange={(e) => setSalonSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Salons Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : salonsFinancial.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Salons Found</h3>
                <p className="text-gray-600">No salons match your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Salon</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Plan</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spent</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Breakdown</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Outstanding</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Payment</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salonsFinancial.map((salon) => (
                      <tr key={salon.salonId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{salon.salonName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-900">{salon.ownerName}</div>
                          <div className="text-xs text-gray-500">{salon.ownerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={salon.currentPlan === 'enterprise' ? 'purple' : salon.currentPlan === 'pro' ? 'blue' : 'green'}>
                            {salon.currentPlan || 'Trial'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">{formatCurrency(salon.totalSpent || 0)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-xs space-y-1">
                            <div>Plans: {formatCurrency(salon.planPayments || 0)}</div>
                            <div>WhatsApp: {formatCurrency(salon.whatsappPayments || 0)}</div>
                            <div>Pixel: {formatCurrency(salon.pixelPayments || 0)}</div>
                            <div>Recurring: {formatCurrency(salon.recurringPayments || 0)}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {salon.outstandingAmount > 0 ? (
                            <span className="font-semibold text-orange-600">{formatCurrency(salon.outstandingAmount)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            {salon.lastPaymentDate ? formatDate(salon.lastPaymentDate) : 'Never'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadSalonHistory(salon.salonId)}
                              title="View Full History"
                            >
                              <Eye size={16} />
                            </Button>
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
      )}

      {/* Revenue Trends Tab */}
      {activeTab === 'trends' && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : revenueTrends.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No revenue data available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Line Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="Total Revenue" />
                      <Line type="monotone" dataKey="subscriptions" stroke="#3b82f6" strokeWidth={2} name="Subscriptions" />
                      <Line type="monotone" dataKey="whatsappCredits" stroke="#22c55e" strokeWidth={2} name="WhatsApp Credits" />
                      <Line type="monotone" dataKey="pixelTracking" stroke="#a855f7" strokeWidth={2} name="Pixel Tracking" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly Breakdown Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Subscriptions</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">WhatsApp</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Pixel</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Recurring</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueTrends.map((trend) => (
                        <tr key={trend.period} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{trend.label}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(trend.subscriptions || 0)}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(trend.whatsappCredits || 0)}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(trend.pixelTracking || 0)}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(trend.recurringBilling || 0)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">{formatCurrency(trend.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Salon History Modal */}
      {showSalonModal && salonHistory && (
        <Modal
          isOpen={showSalonModal}
          onClose={() => {
            setShowSalonModal(false)
            setSalonHistory(null)
          }}
          title={`Financial History - ${salonHistory.salon?.name}`}
        >
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(salonHistory.summary?.totalPaid || 0)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Unpaid</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(salonHistory.summary?.totalUnpaid || 0)}</p>
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">All Transactions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {salonHistory.transactions?.map((tx, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTransactionTypeBadge(tx.type)}
                        {getStatusBadge(tx.status)}
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(tx.amount || 0)}</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Date: {formatDate(tx.date)}</div>
                      {tx.paidAt && <div>Paid: {formatDate(tx.paidAt)}</div>}
                      {tx.paymentMethod && <div>Method: {tx.paymentMethod}</div>}
                      {tx.plan && <div>Plan: {tx.plan}</div>}
                      {tx.credits && <div>Credits: {tx.credits}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default FinancialDashboardPage

