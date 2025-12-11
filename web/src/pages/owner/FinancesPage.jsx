import { useEffect, useState } from 'react'
import { financialService } from '../../services/financialService'
import { useLanguage } from '../../context/LanguageContext'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import { DollarSign, TrendingUp, TrendingDown, Users, Calendar, ArrowUpRight, ArrowDownRight, Lock, CheckCircle, History, Eye, X, Plus, Edit, Trash2, Filter } from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const FinancesPage = () => {
  const { t } = useLanguage()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  // Day Closure states
  const [showCloseDayModal, setShowCloseDayModal] = useState(false)
  const [closingDay, setClosingDay] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
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
  
  // Expense Management states
  const [expenses, setExpenses] = useState([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [expenseFilter, setExpenseFilter] = useState('all') // all, category
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('')
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    amount: '',
    description: '',
    vendor: '',
    paymentMethod: 'cash',
    receiptNumber: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: 'none',
    notes: ''
  })

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
    fetchExpenses()
  }, [dateRange, customStartDate, customEndDate])
  
  // Fetch expenses for current date range
  const fetchExpenses = async () => {
    setLoadingExpenses(true)
    try {
      const dates = getDateRange()
      if (!dates) {
        setLoadingExpenses(false)
        return
      }
      
      const expenseData = await financialService.getExpenses({
        startDate: dates.startDate,
        endDate: dates.endDate
      })
      setExpenses(expenseData?.data?.expenses || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to load expenses')
      setExpenses([])
    } finally {
      setLoadingExpenses(false)
    }
  }

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
      await financialService.closeDay(today, actualCash || null, closureNotes, openingCash || '0')
      toast.success('Day closed successfully!')
      setShowCloseDayModal(false)
      setOpeningCash('')
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
  
  // Expense management functions
  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      category: '',
      amount: '',
      description: '',
      vendor: '',
      paymentMethod: 'cash',
      receiptNumber: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: 'none',
      notes: ''
    })
    setShowExpenseModal(true)
  }
  
  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      vendor: expense.vendor || '',
      paymentMethod: expense.paymentMethod || 'cash',
      receiptNumber: expense.receiptNumber || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      isRecurring: expense.isRecurring || false,
      recurringFrequency: expense.recurringFrequency || 'none',
      notes: expense.notes || ''
    })
    setShowExpenseModal(true)
  }
  
  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return
    }
    
    try {
      await financialService.deleteExpense(expenseId)
      toast.success('Expense deleted successfully')
      fetchExpenses()
      fetchDashboardData() // Refresh dashboard to update totals
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }
  
  const handleSaveExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.description) {
      toast.error('Please fill in all required fields')
      return
    }
    
    try {
      const expenseData = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        isRecurring: expenseForm.isRecurring,
        recurringFrequency: expenseForm.isRecurring ? expenseForm.recurringFrequency : 'none'
      }
      
      if (editingExpense) {
        await financialService.updateExpense(editingExpense._id, expenseData)
        toast.success('Expense updated successfully')
      } else {
        await financialService.createExpense(expenseData)
        toast.success('Expense added successfully')
      }
      
      setShowExpenseModal(false)
      fetchExpenses()
      fetchDashboardData() // Refresh dashboard to update totals
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error(error.response?.data?.message || 'Failed to save expense')
    }
  }
  
  // Expense categories
  const expenseCategories = [
    { value: 'rent', label: 'Rent/Lease' },
    { value: 'utilities', label: 'Utilities (Electricity, Water, Gas)' },
    { value: 'supplies', label: 'Supplies/Materials' },
    { value: 'salary', label: 'Salary/Wages' },
    { value: 'marketing', label: 'Marketing/Advertising' },
    { value: 'maintenance', label: 'Maintenance/Repairs' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'other', label: 'Other' }
  ]
  
  // Filter expenses
  const getFilteredExpenses = () => {
    let filtered = expenses
    
    if (expenseCategoryFilter) {
      filtered = filtered.filter(exp => exp.category === expenseCategoryFilter)
    }
    
    return filtered
  }
  
  const filteredExpenses = getFilteredExpenses()
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  
  // Get expenses by category for breakdown
  const expensesByCategory = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount
    return acc
  }, {})

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
          <h1 className="text-3xl font-bold text-gray-900">{t('finance.title', 'Finance Dashboard')}</h1>
          <p className="text-gray-600 mt-1">{t('finance.subtitle', 'Track your salon\'s financial performance')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleAddExpense}
            className="flex items-center gap-2"
          >
            <Plus size={18} />
            {t('finance.addExpense', 'Add Expense')}
          </Button>
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
            {showHistory ? t('finance.hideHistory', 'Hide History') : t('finance.viewHistory', 'View History')}
          </Button>
          {dateRange === 'today' && !todayClosure && !checkingClosure && (
            <Button
              variant="primary"
              onClick={() => setShowCloseDayModal(true)}
              className="flex items-center gap-2"
            >
              <Lock size={18} />
              {t('finance.closeDay', 'Close Day')}
            </Button>
          )}
          {dateRange === 'today' && todayClosure && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="text-green-600" size={18} />
              <span className="text-sm font-medium text-green-700">{t('finance.dayClosed', 'Day Closed')}</span>
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
              <span className="text-sm font-medium text-gray-700">{t('finance.dateRange', 'Date Range')}:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === 'today' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('today')}
                disabled={loading}
              >
                {t('finance.today', 'Today')}
              </Button>
              <Button
                variant={dateRange === 'yesterday' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('yesterday')}
                disabled={loading}
              >
                {t('finance.yesterday', 'Yesterday')}
              </Button>
              <Button
                variant={dateRange === 'custom' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange('custom')}
                disabled={loading}
              >
                {t('finance.customRange', 'Custom Range')}
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
                <span className="text-gray-500">{t('common.to', 'to')}</span>
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
                  `${t('finance.showing', 'Showing')}: ${formatDate(displayStartDate)}`
                ) : (
                  `${t('finance.showing', 'Showing')}: ${formatDate(displayStartDate)} ${t('common.to', 'to')} ${formatDate(displayEndDate)}`
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
              <p className="text-sm text-gray-600 mb-1">{t('finance.totalRevenue', 'Total Revenue')}</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.paymentCount || 0} {t('finance.payments', 'payments')}
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
              <p className="text-sm text-gray-600 mb-1">{t('finance.workerEarnings', 'Worker Earnings')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(summary.totalWorkerEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('finance.commissionsPaid', 'Commissions paid')}
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
              <p className="text-sm text-gray-600 mb-1">{t('finance.salonRevenue', 'Salon Revenue')}</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(summary.totalSalonRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('finance.afterCommissions', 'After commissions')}
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
              <p className="text-sm text-gray-600 mb-1">{t('finance.totalExpenses', 'Total Expenses')}</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filteredExpenses.length} {filteredExpenses.length !== 1 ? t('finance.expenses', 'expenses') : t('finance.expense', 'expense')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Worker Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.workerBreakdown', 'Worker Breakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {workerBreakdown.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('finance.noWorkerEarnings', 'No worker earnings for this period')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.worker', 'Worker')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.services', 'Services')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.totalEarnings', 'Total Earnings')}</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('common.details', 'Details')}</th>
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
                            {t('finance.viewDetails', 'View Details')}
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

      {/* Expenses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('finance.expenses', 'Expenses')}</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                options={[
                  { value: '', label: t('finance.allCategories', 'All Categories') },
                  ...expenseCategories
                ]}
                className="w-48"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingExpenses ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">{t('finance.noExpenses', 'No expenses for this period')}</p>
              <Button variant="outline" onClick={handleAddExpense} className="flex items-center gap-2 mx-auto">
                <Plus size={16} />
                {t('finance.addFirstExpense', 'Add First Expense')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Breakdown */}
              {Object.keys(expensesByCategory).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    const categoryLabel = expenseCategories.find(c => c.value === category)?.label || category
                    return (
                      <div key={category} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{categoryLabel}</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(amount)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Expenses List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.date', 'Date')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.category', 'Category')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.description', 'Description')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.vendor', 'Vendor')}</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.paymentMethod', 'Payment Method')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('common.amount', 'Amount')}</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.recurring', 'Recurring')}</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(expense.date)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {expenseCategories.find(c => c.value === expense.category)?.label || expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                          {expense.receiptNumber && (
                            <p className="text-xs text-gray-500">{t('finance.receipt', 'Receipt')}: {expense.receiptNumber}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {expense.vendor || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                          {expense.paymentMethod?.replace('_', ' ') || 'cash'}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-red-600">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {expense.isRecurring ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {expense.recurringFrequency}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                              title={t('finance.editExpense', 'Edit expense')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                              title={t('finance.deleteExpense', 'Delete expense')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('finance.detailedTransactions', 'Detailed Transactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('finance.noTransactions', 'No transactions for this period')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.date', 'Date')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.status', 'Type')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.description', 'Description')}</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.worker', 'Worker')}</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('common.amount', 'Amount')}</th>
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
                          {transaction.type === 'payment' ? t('finance.payment', 'Payment') : t('finance.expense', 'Expense')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                          {transaction.type === 'payment' && (
                            <p className="text-xs text-gray-500">
                              {transaction.paymentMethod} • {t('finance.commission', 'Commission')}: {formatCurrency(transaction.workerCommission || 0)}
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
                {t('finance.dayClosureHistory', 'Day Closure History')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={historyFilter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('all')}
                >
                  {t('common.all', 'All')}
                </Button>
                <Button
                  variant={historyFilter === 'day' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('day')}
                >
                  {t('finance.last7Days', 'Last 7 Days')}
                </Button>
                <Button
                  variant={historyFilter === 'week' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('week')}
                >
                  {t('finance.last30Days', 'Last 30 Days')}
                </Button>
                <Button
                  variant={historyFilter === 'month' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setHistoryFilter('month')}
                >
                  {t('finance.last90Days', 'Last 90 Days')}
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
              <p className="text-gray-500 text-center py-8">{t('finance.noDayClosures', 'No day closures found')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">{t('common.date', 'Date')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.revenue', 'Revenue')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.expenses', 'Expenses')}</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.netProfit', 'Net Profit')}</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.appointments', 'Appointments')}</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('finance.payments', 'Payments')}</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredHistory().map((closure) => (
                      <tr key={closure._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{formatDate(closure.date)}</p>
                            <p className="text-xs text-gray-500">
                              {t('finance.closedAt', 'Closed at')} {formatDateTime(closure.closedAt)}
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
                            {closure.summary?.profitMargin || 0}% {t('finance.margin', 'margin')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm">
                            <p className="font-medium">{closure.appointments?.completed || 0} {t('finance.completed', 'completed')}</p>
                            <p className="text-xs text-gray-500">
                              {closure.appointments?.total || 0} {t('common.total', 'total')}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm">
                            <p className="font-medium">{closure.payments?.total || 0}</p>
                            {closure.payments?.cash && (
                              typeof closure.payments.cash === 'object' && closure.payments.cash.count > 0 ? (
                                <p className="text-xs text-gray-500">
                                  {closure.payments.cash.count} {t('finance.cash', 'cash')}
                                </p>
                              ) : closure.payments.cash > 0 ? (
                                <p className="text-xs text-gray-500">
                                  {t('finance.cashPayments', 'Cash payments')}
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
                            {t('common.view', 'View')}
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
          setOpeningCash('')
          setActualCash('')
          setClosureNotes('')
        }}
        title={t('finance.closeTheDay', 'Close the Day')}
        size="lg"
      >
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{t('finance.closing', 'Closing')}:</strong> {formatDate(new Date())}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {t('finance.closeDayDescription', 'This will finalize all transactions for today and create a permanent record.')}
            </p>
          </div>

          {dashboardData && (
            <>
              {/* Opening Cash - Fond de Caisse - Prominently Displayed */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-5 mb-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <DollarSign className="text-white" size={20} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-900">
                        {t('finance.openingCash', 'Opening Cash (Fond de Caisse)')}
                      </p>
                      <p className="text-xs text-green-700">
                        {t('finance.openingCashSubtitle', 'Money already in register at start of day')}
                      </p>
                    </div>
                  </div>
                </div>
                <Input
                  type="number"
                  step="0.001"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder={t('finance.enterOpeningCash', 'Enter opening cash amount (e.g., 50.000)')}
                  className="w-full mt-2 text-lg font-semibold"
                />
                <p className="text-xs text-green-700 mt-2 flex items-center gap-1">
                  <span className="font-semibold">💡 {t('finance.tip', 'Tip')}:</span>
                  {t('finance.openingCashDescription', 'Enter the amount of money (coins/bills) that was already in the cash register at the start of the day.')}
                </p>
              </div>

              {/* Expected Cash - Prominently Displayed */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-semibold text-blue-900">
                    {t('finance.expectedCash', 'Expected Cash in Register')}
                  </p>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatCurrency(
                      (parseFloat(openingCash) || 0) + 
                      (dashboardData.cashReconciliation?.expectedCash || 0)
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3 text-sm">
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600 text-xs">{t('finance.openingCash', 'Opening Cash')}</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(parseFloat(openingCash) || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600 text-xs">{t('finance.cashReceived', 'Cash Received')}</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(dashboardData.cashReconciliation?.cashPaymentsReceived || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600 text-xs">{t('finance.cashAdvances', 'Cash Advances Given')}</p>
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(dashboardData.cashReconciliation?.cashAdvancesGiven || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-600 text-xs">{t('finance.cashExpenses', 'Cash Expenses Paid')}</p>
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(dashboardData.cashReconciliation?.cashExpensesPaid || 0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  {t('finance.expectedCashDescription', 'This is the calculated cash amount you should have in your register: Opening Cash + Cash Received - Cash Advances - Cash Expenses.')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{t('finance.totalRevenue', 'Total Revenue')}</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(summary.totalRevenue || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{t('finance.totalExpenses', 'Total Expenses')}</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpenses || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{t('finance.netProfit', 'Net Profit')}</p>
                  <p className="text-xl font-bold text-primary-600">
                    {formatCurrency(summary.netProfit || 0)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{t('finance.payments', 'Payments')}</p>
                  <p className="text-xl font-bold text-gray-900">
                    {summary.paymentCount || 0}
                  </p>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('finance.actualCashAmount', 'Actual Cash Amount')} <span className="text-gray-500">({t('common.optional', 'optional')})</span>
            </label>
            <Input
              type="number"
              step="0.001"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder={t('finance.enterActualCash', 'Enter actual cash count')}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('finance.actualCashDescription', 'Enter the actual cash amount to verify against calculated cash')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.notes', 'Notes')} <span className="text-gray-500">({t('common.optional', 'optional')})</span>
            </label>
            <textarea
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              placeholder={t('finance.addNotesAboutDay', 'Add any notes about the day...')}
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
              {t('finance.closeDay', 'Close Day')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCloseDayModal(false)
                setOpeningCash('')
                setActualCash('')
                setClosureNotes('')
              }}
              fullWidth
            >
              {t('common.cancel', 'Cancel')}
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
        title={`${t('finance.dayClosure', 'Day Closure')} - ${selectedClosure ? formatDate(selectedClosure.date) : ''}`}
        size="xl"
      >
        {selectedClosure && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{t('finance.revenue', 'Revenue')}</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedClosure.summary?.totalRevenue || 0)}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{t('finance.expenses', 'Expenses')}</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(selectedClosure.summary?.totalExpenses || 0)}
                </p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{t('finance.netProfit', 'Net Profit')}</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(selectedClosure.summary?.netProfit || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">{t('finance.margin', 'Margin')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedClosure.summary?.profitMargin || 0}%
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t('finance.appointments', 'Appointments')}</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedClosure.appointments?.total || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('common.total', 'Total')}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedClosure.appointments?.completed || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('finance.completed', 'Completed')}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedClosure.appointments?.cancelled || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('finance.cancelled', 'Cancelled')}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedClosure.appointments?.noShow || 0}
                  </p>
                  <p className="text-xs text-gray-600">{t('finance.noShow', 'No Show')}</p>
                </div>
              </div>
            </div>

            {selectedClosure.payments && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('finance.paymentMethods', 'Payment Methods')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedClosure.payments.cash && (
                    (typeof selectedClosure.payments.cash === 'object' && selectedClosure.payments.cash.count > 0) ||
                    (typeof selectedClosure.payments.cash === 'number' && selectedClosure.payments.cash > 0)
                  ) && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{t('finance.cash', 'Cash')}</p>
                      {typeof selectedClosure.payments.cash === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.cash.count} {t('finance.payments', 'payments')}
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
                      <p className="font-medium text-gray-900">{t('finance.card', 'Card')}</p>
                      {typeof selectedClosure.payments.card === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.card.count} {t('finance.payments', 'payments')}
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
                      <p className="font-medium text-gray-900">{t('finance.online', 'Online')}</p>
                      {typeof selectedClosure.payments.online === 'object' ? (
                        <>
                          <p className="text-sm text-gray-600">
                            {selectedClosure.payments.online.count} {t('finance.payments', 'payments')}
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
                <h4 className="font-semibold text-gray-900 mb-3">{t('finance.cashVerification', 'Cash Verification')}</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  {(() => {
                    // Calculate how many items will be displayed
                    const showOpeningCash = selectedClosure.cashVerification.openingCash !== undefined && selectedClosure.cashVerification.openingCash > 0;
                    const showActualCash = selectedClosure.cashVerification.actualCash !== null;
                    const showDiscrepancy = showActualCash; // Discrepancy is shown when actualCash is shown
                    
                    // Always show Calculated Cash, so count starts at 1
                    let itemCount = 1;
                    if (showOpeningCash) itemCount++;
                    if (showActualCash) itemCount++;
                    if (showDiscrepancy) itemCount++;
                    
                    // Determine grid columns based on actual item count
                    const gridCols = itemCount === 1 ? 'grid-cols-1' : 
                                     itemCount === 2 ? 'grid-cols-2' : 
                                     itemCount === 3 ? 'grid-cols-3' : 
                                     'grid-cols-4';
                    
                    return (
                      <div className={`grid gap-4 ${gridCols}`}>
                        {showOpeningCash && (
                          <div>
                            <p className="text-sm text-gray-600">{t('finance.openingCash', 'Opening Cash')}</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(selectedClosure.cashVerification.openingCash || 0)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">{t('finance.calculatedCash', 'Calculated Cash')}</p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(selectedClosure.cashVerification.calculatedCash || 0)}
                          </p>
                        </div>
                        {showActualCash && (
                          <>
                            <div>
                              <p className="text-sm text-gray-600">{t('finance.actualCash', 'Actual Cash')}</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(selectedClosure.cashVerification.actualCash || 0)}
                              </p>
                            </div>
                            {showDiscrepancy && (
                              <div>
                                <p className="text-sm text-gray-600">{t('finance.discrepancy', 'Discrepancy')}</p>
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
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {selectedClosure.workerPerformance && selectedClosure.workerPerformance.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('finance.workerPerformance', 'Worker Performance')}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">{t('finance.worker', 'Worker')}</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">{t('finance.appointments', 'Appointments')}</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">{t('finance.revenue', 'Revenue')}</th>
                        <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">{t('finance.commission', 'Commission')}</th>
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
                <h4 className="font-semibold text-gray-900 mb-3">{t('finance.topServices', 'Top Services')}</h4>
                <div className="space-y-2">
                  {selectedClosure.topServices.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{service.serviceName}</p>
                        <p className="text-sm text-gray-600">{service.count} {t('finance.appointments', 'appointments')}</p>
                      </div>
                      <p className="font-bold text-green-600">{formatCurrency(service.revenue || 0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClosure.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('common.notes', 'Notes')}</h4>
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
                {t('finance.viewFinanceDataForThisDay', 'View Finance Data for This Day')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowClosureDetails(false)
                  setSelectedClosure(null)
                }}
                fullWidth
              >
                {t('common.close', 'Close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        title={editingExpense ? t('finance.editExpense', 'Edit Expense') : t('finance.addExpense', 'Add Expense')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('finance.category', 'Category')}
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              options={expenseCategories}
              required
            />
            <Input
              label={t('common.amount', 'Amount')}
              type="number"
              step="0.01"
              min="0"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />
          </div>
          
          <Input
            label={t('common.description', 'Description')}
            value={expenseForm.description}
            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
            required
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('finance.vendor', 'Vendor')}
              value={expenseForm.vendor}
              onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
              placeholder={t('common.optional', 'Optional')}
            />
            <Input
              label={t('finance.receiptNumber', 'Receipt Number')}
              value={expenseForm.receiptNumber}
              onChange={(e) => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })}
              placeholder={t('common.optional', 'Optional')}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('finance.paymentMethod', 'Payment Method')}
              value={expenseForm.paymentMethod}
              onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
              options={[
                { value: 'cash', label: t('finance.cash', 'Cash') },
                { value: 'card', label: t('finance.card', 'Card') },
                { value: 'bank_transfer', label: t('finance.bankTransfer', 'Bank Transfer') },
                { value: 'check', label: t('finance.check', 'Check') },
                { value: 'other', label: t('common.other', 'Other') }
              ]}
            />
            <Input
              label={t('common.date', 'Date')}
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              required
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={expenseForm.isRecurring}
              onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
              {t('finance.recurringExpense', 'This is a recurring expense')}
            </label>
          </div>
          
          {expenseForm.isRecurring && (
            <Select
              label={t('finance.recurringFrequency', 'Recurring Frequency')}
              value={expenseForm.recurringFrequency}
              onChange={(e) => setExpenseForm({ ...expenseForm, recurringFrequency: e.target.value })}
              options={[
                { value: 'daily', label: t('finance.daily', 'Daily') },
                { value: 'weekly', label: t('finance.weekly', 'Weekly') },
                { value: 'monthly', label: t('finance.monthly', 'Monthly') },
                { value: 'yearly', label: t('finance.yearly', 'Yearly') }
              ]}
            />
          )}
          
          <Textarea
            label={t('common.notes', 'Notes')}
            value={expenseForm.notes}
            onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
            placeholder={t('finance.additionalNotesOptional', 'Additional notes (optional)')}
            rows={3}
          />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowExpenseModal(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveExpense}
            >
              {editingExpense ? t('finance.updateExpense', 'Update Expense') : t('finance.addExpense', 'Add Expense')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default FinancesPage
