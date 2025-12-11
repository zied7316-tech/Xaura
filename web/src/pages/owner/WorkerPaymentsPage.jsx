import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { workerFinanceService } from '../../services/workerFinanceService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { Wallet, FileText, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Printer, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkerPaymentsPage = () => {
  // SECURITY: Defense in depth - verify user is Owner before rendering
  const { user, isOwner } = useAuth()
  
  if (!user || !isOwner || user.role !== 'Owner') {
    return <Navigate to="/worker/dashboard" replace />
  }
  const [wallets, setWallets] = useState([])
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [workerSummary, setWorkerSummary] = useState(null)
  const [paidEarnings, setPaidEarnings] = useState([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [showInvoiceHistoryModal, setShowInvoiceHistoryModal] = useState(false)
  const [workerInvoices, setWorkerInvoices] = useState([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [invoiceData, setInvoiceData] = useState({
    periodStart: '',
    periodEnd: '',
    paymentMethod: 'cash',
    notes: ''
  })

  const [advanceData, setAdvanceData] = useState({
    amount: '',
    reason: '',
    notes: '',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const data = await workerFinanceService.getAllWorkersWallets()
      setWallets(data)
    } catch (error) {
      console.error('Error loading wallets:', error)
      toast.error('Failed to load worker wallets')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkerDetails = async (workerId) => {
    try {
      const [summary, earnings] = await Promise.all([
        workerFinanceService.getWorkerFinancialSummary(workerId),
        workerFinanceService.getWorkerPaidEarnings(workerId)
      ])
      
      setWorkerSummary(summary)
      setPaidEarnings(earnings.earnings)
    } catch (error) {
      console.error('Error loading worker details:', error)
      toast.error('Failed to load worker details')
    }
  }

  const handleSelectWorker = async (wallet) => {
    setSelectedWorker(wallet)
    await loadWorkerDetails(wallet.workerId._id)
    
    // Set default period to last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    
    setInvoiceData({
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    })
  }

  const handleGiveAdvance = async () => {
    if (!selectedWorker || !advanceData.amount) {
      toast.error('Please enter an advance amount')
      return
    }

    const amount = parseFloat(advanceData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setGenerating(true)
    try {
      await workerFinanceService.giveAdvance({
        workerId: selectedWorker.workerId._id,
        amount,
        reason: advanceData.reason || '',
        notes: advanceData.notes || '',
        paymentMethod: advanceData.paymentMethod || 'cash'
      })
      
      toast.success('Advance given successfully!')
      setShowAdvanceModal(false)
      setAdvanceData({ amount: '', reason: '', notes: '', paymentMethod: 'cash' })
      setSelectedWorker(null)
      loadWallets()
    } catch (error) {
      console.error('Error giving advance:', error)
      toast.error(error.response?.data?.message || 'Failed to give advance')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectWorkerForAdvance = (wallet) => {
    setSelectedWorker(wallet)
    setAdvanceData({ amount: '', reason: '', notes: '', paymentMethod: 'cash' })
    setShowAdvanceModal(true)
  }

  const handleViewInvoices = async (wallet) => {
    setSelectedWorker(wallet)
    setShowInvoiceHistoryModal(true)
    setLoadingInvoices(true)
    try {
      const invoices = await workerFinanceService.getWorkerInvoices(wallet.workerId._id)
      setWorkerInvoices(invoices || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Failed to load invoices')
      setWorkerInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!selectedWorker) return

    if (!invoiceData.periodStart || !invoiceData.periodEnd) {
      toast.error('Please select a period')
      return
    }

    setGenerating(true)
    try {
      await workerFinanceService.generateInvoice({
        workerId: selectedWorker.workerId._id,
        ...invoiceData
      })
      
      toast.success('Invoice generated and payment processed successfully!')
      setShowInvoiceModal(false)
      setSelectedWorker(null)
      setWorkerSummary(null)
      loadWallets()
    } catch (error) {
      console.error('Error generating invoice:', error)
      console.error('Full error response:', error.response?.data)
      console.error('Request data sent:', {
        workerId: selectedWorker.workerId._id,
        ...invoiceData
      })
      const errorMessage = error.response?.data?.message || 'Failed to generate invoice'
      const errorDetails = error.response?.data?.details
      
      if (errorDetails) {
        toast.error(`${errorMessage}\nAvailable: ${errorDetails.availableToInvoice || 0}, Already invoiced: ${errorDetails.alreadyInvoiced || 0}`, {
          duration: 5000
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setGenerating(false)
    }
  }

  // Quick pay for today
  const handlePayToday = async (wallet) => {
    if (!wallet || wallet.balance === 0) {
      toast.error('No balance available')
      return
    }

    setGenerating(true)
    try {
      const today = new Date()
      const startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0)
      
      const endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999)
      
      await workerFinanceService.generateInvoice({
        workerId: wallet.workerId._id,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: `Quick payment for today's work`
      })
      
      toast.success('Invoice generated for today!')
      loadWallets()
    } catch (error) {
      console.error('Error generating invoice:', error)
      console.error('Full error response:', error.response?.data)
      console.error('Request data sent:', {
        workerId: wallet.workerId._id,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: `Quick payment for today's work`
      })
      const errorMessage = error.response?.data?.message || 'Failed to generate invoice'
      const errorDetails = error.response?.data?.details
      
      if (errorDetails) {
        const isOutOfSync = errorDetails.balanceOutOfSync
        let message = errorMessage
        
        if (isOutOfSync) {
          message = `Balance is out of sync!\nWallet shows: ${formatCurrency(errorDetails.walletBalance || 0)}\nActual available: ${formatCurrency(errorDetails.actualAvailableBalance || 0)}\n\nAll paid earnings are already invoiced. Please recalculate the balance.`
        } else {
          message = `${errorMessage}\nAvailable: ${errorDetails.availableToInvoice || 0}, Already invoiced: ${errorDetails.alreadyInvoiced || 0}`
        }
        
        toast.error(message, {
          duration: 7000
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setGenerating(false)
    }
  }

  // Quick pay for all available balance
  const handlePayAllBalance = async (wallet) => {
    if (!wallet || wallet.balance === 0) {
      toast.error('No balance available')
      return
    }

    if (!confirm(`Pay all balance (${formatCurrency(wallet.balance)}) to ${wallet.workerId.name}?`)) {
      return
    }

    setGenerating(true)
    try {
      // Don't set period - get ALL paid earnings that haven't been invoiced
      // Omit periodStart and periodEnd instead of sending null
      const invoice = await workerFinanceService.generateInvoice({
        workerId: wallet.workerId._id,
        // periodStart and periodEnd omitted = Pay All Balance
        paymentMethod: 'cash',
        notes: `Full balance payment`
      })
      
      toast.success('Full balance invoice generated!', {
        duration: 5000,
        action: invoice?._id ? {
          label: 'View Invoice',
          onClick: () => window.open(`/owner/invoice/${invoice._id}`, '_blank')
        } : undefined
      })
      loadWallets()
    } catch (error) {
      console.error('Error generating invoice:', error)
      console.error('Full error response:', error.response?.data)
      console.error('Request data sent:', {
        workerId: wallet.workerId._id,
        // periodStart and periodEnd omitted = Pay All Balance
        paymentMethod: 'cash',
        notes: `Full balance payment`
      })
      const errorMessage = error.response?.data?.message || 'Failed to generate invoice'
      const errorDetails = error.response?.data?.details
      
      if (errorDetails) {
        const isOutOfSync = errorDetails.balanceOutOfSync
        let message = errorMessage
        
        if (isOutOfSync) {
          message = `Balance is out of sync!\nWallet shows: ${formatCurrency(errorDetails.walletBalance || 0)}\nActual available: ${formatCurrency(errorDetails.actualAvailableBalance || 0)}\n\nAll paid earnings are already invoiced. Please recalculate the balance.`
        } else {
          message = `${errorMessage}\nAvailable: ${errorDetails.availableToInvoice || 0}, Already invoiced: ${errorDetails.alreadyInvoiced || 0}`
        }
        
        toast.error(message, {
          duration: 7000
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setGenerating(false)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalUnpaidAmount = wallets.reduce((sum, w) => sum + w.balance, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">💰 Worker Finances</h1>
        <p className="text-gray-600 mt-1">View all workers' earnings and manage payments</p>
      </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Unpaid</p>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalUnpaidAmount)}</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Wallet className="mx-auto text-primary-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{wallets.length}</p>
            <p className="text-gray-600 text-sm">Total Workers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto text-orange-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-orange-600">
              {wallets.filter(w => w.balance > 0).length}
            </p>
            <p className="text-gray-600 text-sm">Pending Payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(wallets.reduce((sum, w) => sum + w.totalPaid, 0))}
            </p>
            <p className="text-gray-600 text-sm">Total Paid Out</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(wallets.reduce((sum, w) => sum + w.totalEarned, 0))}
            </p>
            <p className="text-gray-600 text-sm">Total Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Workers List */}
      <Card>
        <CardHeader>
          <CardTitle>Worker Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No workers yet</p>
              <p className="text-gray-500 text-sm mt-1">Add workers to start tracking their earnings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Worker</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Payment Model</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Balance</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Outstanding Advances</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Unpaid Amount</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Earned</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Paid</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Payout</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {wallet.workerId.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{wallet.workerId.name}</p>
                            <p className="text-sm text-gray-500">{wallet.workerId.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                        {wallet.workerId.paymentModel?.type?.replace('_', ' ') || 'Not set'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${wallet.balance > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {formatCurrency(wallet.balance)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(() => {
                          const netBalance = wallet.netBalance !== undefined 
                            ? wallet.netBalance 
                            : (wallet.balance || 0) - (wallet.outstandingAdvances || 0);
                          const isNegative = netBalance < 0;
                          return (
                            <span className={`font-semibold ${isNegative ? 'text-red-600' : netBalance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {formatCurrency(netBalance)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${(wallet.outstandingAdvances || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {formatCurrency(wallet.outstandingAdvances || 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(() => {
                          // Ensure proper number conversion and explicit calculation
                          const balance = Number(wallet.balance) || 0;
                          const outstandingAdvances = Number(wallet.outstandingAdvances) || 0;
                          const unpaidAmount = balance - outstandingAdvances;
                          const isNegative = unpaidAmount < 0;
                          return (
                            <span className={`font-semibold ${isNegative ? 'text-red-600' : unpaidAmount > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                              {formatCurrency(unpaidAmount)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 font-medium">
                        {formatCurrency(wallet.totalEarned)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        {formatCurrency(wallet.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {wallet.lastPayoutDate ? formatDate(wallet.lastPayoutDate) : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePayToday(wallet)}
                            disabled={wallet.balance === 0 || generating}
                            title="Pay for today's work"
                          >
                            💰 Pay Today
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handlePayAllBalance(wallet)}
                            disabled={wallet.balance === 0 || generating}
                            title="Pay all available balance"
                          >
                            💵 Pay All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleSelectWorker(wallet)
                              setShowInvoiceModal(true)
                            }}
                            disabled={wallet.balance === 0}
                            title="Custom period"
                          >
                            📅 Custom
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectWorkerForAdvance(wallet)}
                            disabled={generating}
                            title="Give advance payment"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            💳 Advance
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoices(wallet)}
                            disabled={generating}
                            title="View invoice history"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye size={16} className="mr-1" />
                            Invoices
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

      {/* Generate Invoice Modal */}
      <Modal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false)
          setSelectedWorker(null)
          setWorkerSummary(null)
        }}
        title="Generate Invoice & Process Payment"
        size="lg"
      >
        {selectedWorker && (
          <div className="space-y-6">
            {/* Worker Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Worker Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{selectedWorker.workerId.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(selectedWorker.balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            {workerSummary && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">Unpaid Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{workerSummary.unpaidCount}</p>
                  </CardContent>
                </Card>
                <Card className="border">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">This Month Earnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(workerSummary.monthlyEarnings)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Invoice Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Period Start"
                  type="date"
                  value={invoiceData.periodStart}
                  onChange={(e) => setInvoiceData({ ...invoiceData, periodStart: e.target.value })}
                />
                <Input
                  label="Period End"
                  type="date"
                  value={invoiceData.periodEnd}
                  onChange={(e) => setInvoiceData({ ...invoiceData, periodEnd: e.target.value })}
                />
              </div>

              <Select
                label="Payment Method"
                value={invoiceData.paymentMethod}
                onChange={(e) => setInvoiceData({ ...invoiceData, paymentMethod: e.target.value })}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'check', label: 'Check' },
                  { value: 'other', label: 'Other' }
                ]}
              />

              <Input
                label="Notes (Optional)"
                placeholder="Add any notes about this payment..."
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              />
            </div>

            {/* Paid Earnings Preview (that can be invoiced) */}
            {paidEarnings.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paid Earnings Ready to Invoice</h3>
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-700">Date</th>
                        <th className="text-left py-2 px-3 text-gray-700">Service</th>
                        <th className="text-right py-2 px-3 text-gray-700">Earning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidEarnings.map((earning) => (
                        <tr key={earning._id} className="border-t">
                          <td className="py-2 px-3">{formatDate(earning.serviceDate)}</td>
                          <td className="py-2 px-3">{earning.serviceId?.name || 'Service'}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatCurrency(earning.workerEarning)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleGenerateInvoice}
                loading={generating}
                disabled={!selectedWorker || selectedWorker.balance === 0}
                fullWidth
              >
                <FileText size={18} />
                Generate Invoice & Mark as Paid
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInvoiceModal(false)
                  setSelectedWorker(null)
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Give Advance Modal */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => {
          setShowAdvanceModal(false)
          setSelectedWorker(null)
          setAdvanceData({ amount: '', reason: '', notes: '', paymentMethod: 'cash' })
        }}
        title="Give Advance Payment"
        size="md"
      >
        {selectedWorker && (
          <div className="space-y-6">
            {/* Worker Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Worker Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{selectedWorker.workerId.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Balance</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(selectedWorker.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Outstanding Advances</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(selectedWorker.outstandingAdvances || 0)}
                  </p>
                </div>
                {selectedWorker.advanceLimit && (
                  <div>
                    <p className="text-gray-600">Advance Limit</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedWorker.advanceLimit)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Advance Details */}
            <div className="space-y-4">
              <Input
                label="Advance Amount *"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={advanceData.amount}
                onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                required
              />

              <Input
                label="Reason (Optional)"
                placeholder="e.g., Emergency, Personal expense..."
                value={advanceData.reason}
                onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
              />

              <Input
                label="Notes (Optional)"
                placeholder="Add any additional notes..."
                value={advanceData.notes}
                onChange={(e) => setAdvanceData({ ...advanceData, notes: e.target.value })}
              />
            </div>

            {/* Warning if limit exceeded */}
            {selectedWorker.advanceLimit && advanceData.amount && (
              (parseFloat(advanceData.amount) + (selectedWorker.outstandingAdvances || 0)) > selectedWorker.advanceLimit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-red-600 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-red-800">Advance Limit Warning</p>
                      <p className="text-sm text-red-700 mt-1">
                        This advance will exceed the limit. Current outstanding: {formatCurrency(selectedWorker.outstandingAdvances || 0)}, Limit: {formatCurrency(selectedWorker.advanceLimit)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={handleGiveAdvance}
                loading={generating}
                disabled={!advanceData.amount || parseFloat(advanceData.amount) <= 0}
                fullWidth
                className="bg-purple-600 hover:bg-purple-700"
              >
                💳 Give Advance
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdvanceModal(false)
                  setSelectedWorker(null)
                  setAdvanceData({ amount: '', reason: '', notes: '', paymentMethod: 'cash' })
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice History Modal */}
      <Modal
        isOpen={showInvoiceHistoryModal}
        onClose={() => {
          setShowInvoiceHistoryModal(false)
          setSelectedWorker(null)
          setWorkerInvoices([])
        }}
        title="Invoice History"
        size="lg"
      >
        {selectedWorker && (
          <div className="space-y-4">
            {/* Worker Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Worker Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="text-gray-900 font-medium">{selectedWorker.workerId.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="text-gray-900 font-medium">{selectedWorker.workerId.email}</p>
                </div>
              </div>
            </div>

            {/* Invoices List */}
            {loadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : workerInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No invoices found</p>
                <p className="text-gray-500 text-sm mt-1">Invoices will appear here after payments are processed</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {workerInvoices.map((invoice) => (
                  <Card key={invoice._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {invoice.invoiceNumber}
                            </h3>
                            <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Date</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(invoice.paidDate || invoice.createdAt)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Amount</p>
                              <p className="font-semibold text-primary-600">
                                {formatCurrency(invoice.totalAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Services</p>
                              <p className="font-medium text-gray-900">
                                {invoice.appointmentsCount || 0} appointments
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Payment Method</p>
                              <p className="font-medium text-gray-900 capitalize">
                                {invoice.paymentMethod?.replace('_', ' ') || 'Cash'}
                              </p>
                            </div>
                            {invoice.periodStart && invoice.periodEnd && (
                              <>
                                <div>
                                  <p className="text-gray-600">Period Start</p>
                                  <p className="font-medium text-gray-900">
                                    {formatDate(invoice.periodStart)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Period End</p>
                                  <p className="font-medium text-gray-900">
                                    {formatDate(invoice.periodEnd)}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              window.open(`/owner/invoice/${invoice._id}`, '_blank')
                            }}
                            className="flex items-center gap-2"
                          >
                            <Eye size={16} />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerPaymentsPage

