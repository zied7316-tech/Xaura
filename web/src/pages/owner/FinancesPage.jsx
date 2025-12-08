import { useEffect, useState } from 'react'
import { financialService } from '../../services/financialService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const FinancesPage = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const getDateRange = () => {
    const today = new Date()
    let start, end

    switch (dateRange) {
      case 'today':
        start = new Date(today)
        start.setHours(0, 0, 0, 0)
        end = new Date(today)
        end.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        start = new Date(yesterday)
        start.setHours(0, 0, 0, 0)
        end = new Date(yesterday)
        end.setHours(23, 59, 59, 999)
        break
      case 'custom':
        if (!customStartDate || !customEndDate) {
          toast.error('Please select both start and end dates')
          return null
        }
        start = new Date(customStartDate)
        start.setHours(0, 0, 0, 0)
        end = new Date(customEndDate)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start = new Date(today)
        start.setHours(0, 0, 0, 0)
        end = new Date(today)
        end.setHours(23, 59, 59, 999)
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
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

  const handleDateRangeChange = (range) => {
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
  const displayStartDate = currentDateRange ? new Date(currentDateRange.startDate) : null
  const displayEndDate = currentDateRange ? new Date(currentDateRange.endDate) : null

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
                Showing: {formatDate(displayStartDate)} to {formatDate(displayEndDate)}
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
    </div>
  )
}

export default FinancesPage
