import { useEffect, useState } from 'react'
import { financialService } from '../../services/financialService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, ArrowUpRight, ArrowDownRight, Lock, CheckCircle, History, Eye, X } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const FinancesPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Day Closure states
  const [showCloseDayModal, setShowCloseDayModal] = useState(false)
  const [closingDay, setClosingDay] = useState(false)
  const [actualCash, setActualCash] = useState('')
  const [closureNotes, setClosureNotes] = useState('')
  const [todayClosure, setTodayClosure] = useState(null)
  const [checkingClosure, setCheckingClosure] = useState(false)
  
  // Closure History states
  const [showHistory, setShowHistory] = useState(false)
  const [closureHistory, setClosureHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyFilter, setHistoryFilter] = useState('all') // all, day, week, month
  const [selectedClosure, setSelectedClosure] = useState(null)
  const [showClosureDetails, setShowClosureDetails] = useState(false)

  const getDateRange = () => {
    const today = new Date()
    // Get local date components to avoid timezone issues
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    
    let start, end

    switch (dateRange) {
      case 'today':
        start = new Date(year, month, day, 0, 0, 0, 0)
        end = new Date(year, month, day, 23, 59, 59, 999)
        break
      case 'yesterday':
        const yesterday = new Date(year, month, day - 1, 0, 0, 0, 0)
        start = new Date(yesterday)
        end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates')
          return null
        }
        // Parse custom dates in local timezone
        const startParts = customStartDate.split('-').map(Number)
        const endParts = customEndDate.split('-').map(Number)
        start = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0)
        end = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999)
        break
      default:
        start = new Date(year, month, day, 0, 0, 0, 0)
        end = new Date(year, month, day, 23, 59, 59, 999)
    }

    // Format dates as YYYY-MM-DD in local timezone
    const formatDateLocal = (date) => {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    }

    return {
      startDate: formatDateLocal(start),
      endDate: formatDateLocal(end)
    }
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const dates = getDateRange()
      if (!dates) {
        setLoading(false)
        return
      }

      const data = await financialService.getFinanceDashboard(dates.startDate, dates.endDate)
      // Ensure we're accessing the correct data structure
      // Backend returns: { success: true, data: { summary, workerBreakdown, transactions } }
      // After interceptor: { success: true, data: { summary, workerBreakdown, transactions } }
      // Service should return: data object
      setDashboardData(data?.data || data)
    } catch (error) {
      console.error('Error fetching finance dashboard:', error)
      toast.error('Failed to load finance dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange, customStartDate, customEndDate])

  // Check if today is closed
  useEffect(() => {
    const checkTodayClosure = async () => {
      if (dateRange === 'today') {
        setCheckingClosure(true)
        try {
          const today = new Date().toISOString().split('T')[0]
          const closure = await financialService.getDayClosure(today)
          setTodayClosure(closure)
        } catch (error) {
          // Day not closed yet - that's fine
          setTodayClosure(null)
        } finally {
          setCheckingClosure(false)
        }
      } else {
        setTodayClosure(null)
      }
    }
    checkTodayClosure()
  }, [dateRange])

  // Load closure history
  const loadClosureHistory = async () => {
    setLoadingHistory(true)
    try {
      const closures = await financialService.getDayClosureHistory(365) // Get last year
      console.log('Loaded closure history:', closures)
      setClosureHistory(closures || [])
      if (closures && closures.length === 0) {
        console.warn('No closures found in history')
      }
    } catch (error) {
      console.error('Error loading closure history:', error)
      toast.error('Failed to load closure history')
      setClosureHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (showHistory) {
      loadClosureHistory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory])

  // Close the day
  const handleCloseDay = async () => {
    if (!actualCash && actualCash !== '0') {
      toast.error('Please enter actual cash amount (enter 0 if no cash)')
      return
    }

    setClosingDay(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await financialService.closeDay(today, actualCash || null, closureNotes)
      toast.success('Day closed successfully!')
      setShowCloseDayModal(false)
      setActualCash('')
      setClosureNotes('')
      // Refresh today's closure status
      const closure = await financialService.getDayClosure(today)
      setTodayClosure(closure)
      // Refresh dashboard data
      fetchDashboardData()
      // Refresh closure history if it's already loaded
      if (showHistory) {
        await loadClosureHistory()
      }
    } catch (error) {
      console.error('Error closing day:', error)
      const errorMessage = error.response?.data?.message || 'Failed to close day'
      toast.error(errorMessage)
    } finally {
      setClosingDay(false)
    }
  }

  // View closure details and load that day's finance data
  const handleViewClosure = async (closure) => {
    setSelectedClosure(closure)
    setShowClosureDetails(true)
    
    // Load finance data for that day
    const closureDate = new Date(closure.date).toISOString().split('T')[0]
    setDateRange('custom')
    setCustomStartDate(closureDate)
    setCustomEndDate(closureDate)
    // fetchDashboardData will be called by useEffect
  }

  // Filter closure history
  const getFilteredHistory = () => {
    if (historyFilter === 'all') return closureHistory
    
    const now = new Date()
    const filtered = closureHistory.filter(closure => {
      const closureDate = new Date(closure.date)
      const daysDiff = Math.floor((now - closureDate) / (1000 * 60 * 60 * 24))
      
      if (historyFilter === 'day') return daysDiff <= 7
      if (historyFilter === 'week') return daysDiff <= 30
      if (historyFilter === 'month') return daysDiff <= 90
      return true
    })
    
    return filtered
  }

  const handleDateRangeChange = (range) => {
    // Don't clear data if clicking the same button
    if (dateRange === range && range !== 'custom') {
      return
    }
    
    setDateRange(range)
    // Reset custom dates when switching to non-custom range
    if (range !== 'custom') {
      setCustomStartDate('')
      setCustomEndDate('')
    }
    // Clear existing data when changing date range to show loading state
    setDashboardData(null)
  }

  const handleCustomDateChange = (type, value) => {
    if (type === 'start') {
      setCustomStartDate(value)
    } else {
      setCustomEndDate(value)
    }
    // Clear existing data when changing custom dates
    setDashboardData(null)
  }

  const summary = dashboardData?.summary || {}
  const workerBreakdown = dashboardData?.workerBreakdown || []
  const transactions = dashboardData?.transactions || []

  // Get current date range for display
  const currentDateRange = getDateRange()
  // Parse dates in local timezone to avoid timezone conversion issues
  const parseDateLocal = (dateString) => {
    if (!dateString) return null
    const parts = dateString.split('-').map(Number)
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  const displayStartDate = currentDateRange ? parseDateLocal(currentDateRange.startDate) : null
  const displayEndDate = currentDateRange ? parseDateLocal(currentDateRange.endDate) : null

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your salon's financial performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const newShowHistory = !showHistory
              setShowHistory(newShowHistory)
              if (newShowHistory) {
                loadClosureHistory()
              }
            }}
            className="flex items-center gap-2"
          >
            <History size={18} />
            {showHistory ? 'Hide History' : 'View History'}
          </Button>
          {dateRange === 'today' && !todayClosure && !checkingClosure && (
            <Button
              variant="primary"
              onClick={() => setShowCloseDayModal(true)}
              className="flex items-center gap-2"
            >
              <Lock size={18} />
              Close Day
            </Button>
          )}
          {dateRange === 'today' && todayClosure && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={18} />
              <span className="text-sm font-medium text-green-700">Day Closed</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-gray-500" size={20} />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'today' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('today')}
                disabled={loading}
              >
                Today
              </Button>
              <Button
                variant={dateRange === 'yesterday' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('yesterday')}
                disabled={loading}
              >
                Yesterday
              </Button>
              <Button
                variant={dateRange === 'custom' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('custom')}
                disabled={loading}
              >
                Custom Range
              </Button>
            </div>
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => handleCustomDateChange('start', e.target.value)}
                  className="w-40"
                  disabled={loading}
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => handleCustomDateChange('end', e.target.value)}
                  className="w-40"
                  disabled={loading}
                />
              </div>
            )}
            {dashboardData && displayStartDate && displayEndDate && (
              <div className="ml-auto text-sm text-gray-600">
                {dateRange === 'today' || dateRange === 'yesterday' ? (
                  `Showing: ${formatDate(displayStartDate)}`
                ) : (
                  `Showing: ${formatDate(displayStartDate)} to ${formatDate(displayEndDate)}`
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.paymentCount || 0} payments
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Worker Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalWorkerEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Commissions paid
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Salon Revenue</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(summary.totalSalonRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                After commissions
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Net Profit</p>
              <p className={`text-2xl font-bold ${(summary.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netProfit || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Margin: {summary.profitMargin || 0}%
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${(summary.netProfit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {(summary.netProfit || 0) >= 0 ? (
                <TrendingUp className="text-green-600" size={24} />
              ) : (
                <TrendingDown className="text-red-600" size={24} />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Worker Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {workerBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No worker earnings for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Worker</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Services</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Earnings</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {workerBreakdown.map((worker) => (
                    <tr key={worker.workerId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{worker.workerName}</p>
                          <p className="text-sm text-gray-500">{worker.workerEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">
                        {worker.servicesCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(worker.totalEarnings)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-primary-600 hover:text-primary-700">
                            View Details
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <div className="space-y-2">
                              {worker.earnings.map((earning, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-medium">{earning.serviceName}</span>
                                    <span className="text-gray-500 ml-2">
                                      {formatDate(earning.serviceDate)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-gray-900">
                                      {formatCurrency(earning.workerEarning)}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      ({earning.commissionPercentage}%)
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Worker</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'payment' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'payment' ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                          {transaction.type === 'payment' ? 'Payment' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          {transaction.type === 'payment' && (
                            <p className="text-xs text-gray-500">
                              {transaction.paymentMethod} • Commission: {formatCurrency(transaction.workerCommission || 0)}
                            </p>
                          )}
                          {transaction.type === 'expense' && transaction.category && (
                            <p className="text-xs text-gray-500">
                              {transaction.category} {transaction.vendor ? `• ${transaction.vendor}` : ''}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.workerName || '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Closure History Section */}
      {showHistory && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History size={20} />
                Day Closure History
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={historyFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={historyFilter === 'day' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('day')}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={historyFilter === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('week')}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant={historyFilter === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('month')}
                >
                  Last 90 Days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : getFilteredHistory().length === 0 ? (
              <p className="text-gray-500 text-center py-8">No day closures found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Expenses</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Profit</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Appointments</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Payments</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredHistory().map((closure) => (
                      <tr key={closure._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(closure.date)}</p>
                            <p className="text-xs text-gray-500">
                              Closed at {formatDateTime(closure.closedAt)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(closure.summary?.totalRevenue || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-red-600">
                            {formatCurrency(closure.summary?.totalExpenses || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${
                            (closure.summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(closure.summary?.netProfit || 0)}
                          </span>
                          <p className="text-xs text-gray-500">
                            {closure.summary?.profitMargin || 0}% margin
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm">
                            <p className="font-medium">{closure.appointments?.completed || 0} completed</p>
                            <p className="text-xs text-gray-500">
                              {closure.appointments?.total || 0} total
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm">
                            <p className="font-medium">{closure.payments?.total || 0}</p>
                            {closure.payments?.cash && (
                              typeof closure.payments.cash === 'object' && closure.payments.cash.count > 0 ? (
                                <p className="text-xs text-gray-500">
                                  {closure.payments.cash.count} cash
                                </p>
                              ) : closure.payments.cash > 0 ? (
                                <p className="text-xs text-gray-500">
                                  Cash payments
                                </p>
                              ) : null
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClosure(closure)}
                            className="flex items-center gap-1"
                          >
                            <Eye size={16} />
                            View
                          </Button>
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

      {/* Close Day Modal */}
      <Modal
        isOpen={showCloseDayModal}
        onClose={() => {
          setShowCloseDayModal(false)
          setActualCash('')
          setClosureNotes('')
        }}
        title="Close the Day"
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Closing:</strong> {formatDate(new Date())}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will finalize all transactions for today and create a permanent record.
            </p>
          </div>

          {dashboardData && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(summary.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(summary.netProfit || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Payments</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.paymentCount || 0}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Cash Amount <span className="text-gray-500">(optional)</span>
            </label>
            <Input
              type="number"
              step="0.001"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="Enter actual cash count"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the actual cash amount to verify against calculated cash
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder="Add any notes about the day..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleCloseDay}
              loading={closingDay}
              disabled={closingDay}
              fullWidth
            >
              <Lock size={18} className="mr-2" />
              Close Day
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseDayModal(false)
                setActualCash('')
                setClosureNotes('')
              }}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Closure Details Modal */}
      <Modal
        isOpen={showClosureDetails}
        onClose={() => {
          setShowClosureDetails(false)
          setSelectedClosure(null)
        }}
        title={`Day Closure - ${selectedClosure ? formatDate(selectedClosure.date) : ''}`}
        size="xl"
      >
        {selectedClosure && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedClosure.summary?.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(selectedClosure.summary?.totalExpenses || 0)}
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(selectedClosure.summary?.netProfit || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Margin</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedClosure.summary?.profitMargin || 0}%
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Appointments</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedClosure.appointments?.total || 0}
                  </p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedClosure.appointments?.completed || 0}
                  </p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedClosure.appointments?.cancelled || 0}
                  </p>
                  <p className="text-xs text-gray-600">Cancelled</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedClosure.appointments?.noShow || 0}
                  </p>
                  <p className="text-xs text-gray-600">No Show</p>
                </div>
              </div>
            </div>

            {selectedClosure.payments && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Methods</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedClosure.payments.cash && (
                    (typeof selectedClosure.payments.cash === 'object' && selectedClosure.payments.cash.count > 0) ||
                    (typeof selectedClosure.payments.cash === 'number' && selectedClosure.payments.cash > 0)
                  ) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">Cash</p>
                      {typeof selectedClosure.payments.cash === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.cash.count} payments
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedClosure.payments.cash.amount || 0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedClosure.payments.cash || 0)}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedClosure.payments.card && (
                    (typeof selectedClosure.payments.card === 'object' && selectedClosure.payments.card.count > 0) ||
                    (typeof selectedClosure.payments.card === 'number' && selectedClosure.payments.card > 0)
                  ) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">Card</p>
                      {typeof selectedClosure.payments.card === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.card.count} payments
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedClosure.payments.card.amount || 0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedClosure.payments.card || 0)}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedClosure.payments.online && (
                    (typeof selectedClosure.payments.online === 'object' && selectedClosure.payments.online.count > 0) ||
                    (typeof selectedClosure.payments.online === 'number' && selectedClosure.payments.online > 0)
                  ) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">Online</p>
                      {typeof selectedClosure.payments.online === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.online.count} payments
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedClosure.payments.online.amount || 0)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(selectedClosure.payments.online || 0)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedClosure.cashVerification && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Cash Verification</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Calculated Cash</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedClosure.cashVerification.calculatedCash || 0)}
                      </p>
                    </div>
                    {selectedClosure.cashVerification.actualCash !== null && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Actual Cash</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedClosure.cashVerification.actualCash || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Discrepancy</p>
                          <p className={`text-lg font-bold ${
                            (selectedClosure.cashVerification.discrepancy || 0) === 0
                              ? 'text-green-600'
                              : (selectedClosure.cashVerification.discrepancy || 0) > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatCurrency(selectedClosure.cashVerification.discrepancy || 0)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedClosure.workerPerformance && selectedClosure.workerPerformance.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Worker Performance</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Worker</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Appointments</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Revenue</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClosure.workerPerformance.map((worker, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-2 px-3">{worker.workerName}</td>
                          <td className="py-2 px-3 text-right">{worker.appointmentsCompleted}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(worker.revenue || 0)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(worker.commission || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedClosure.topServices && selectedClosure.topServices.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Top Services</h4>
                <div className="space-y-2">
                  {selectedClosure.topServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{service.serviceName}</p>
                        <p className="text-sm text-gray-600">{service.count} appointments</p>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(service.revenue || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClosure.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedClosure.notes}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="primary"
                onClick={() => {
                  handleViewClosure(selectedClosure)
                  setShowClosureDetails(false)
                }}
                fullWidth
              >
                View Finance Data for This Day
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowClosureDetails(false)
                  setSelectedClosure(null)
                }}
                fullWidth
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FinancesPage
