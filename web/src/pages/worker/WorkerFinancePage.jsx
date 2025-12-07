import { useState, useEffect } from 'react'
import { workerFinanceService } from '../../services/workerFinanceService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Wallet, Clock, CheckCircle, DollarSign, FileText, Calendar, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkerFinancePage = () => {
  const [wallet, setWallet] = useState(null)
  const [paidEarnings, setPaidEarnings] = useState([])
  const [unpaidEarnings, setUnpaidEarnings] = useState([])
  const [estimatedEarnings, setEstimatedEarnings] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [advances, setAdvances] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('paid')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadFinancialData()
  }, [])

  const loadFinancialData = async () => {
    try {
      const [walletData, paidData, unpaidData, estimatedData, historyData, advancesData] = await Promise.all([
        workerFinanceService.getWallet(),
        workerFinanceService.getPaidEarnings(),
        workerFinanceService.getUnpaidEarnings(),
        workerFinanceService.getEstimatedEarnings(),
        workerFinanceService.getPaymentHistory(),
        workerFinanceService.getWorkerAdvances()
      ])
      
      setWallet(walletData)
      setPaidEarnings(paidData.earnings || [])
      setUnpaidEarnings(unpaidData.earnings || [])
      setEstimatedEarnings(estimatedData)
      setPaymentHistory(historyData)
      setAdvances(advancesData.advances || [])
    } catch (error) {
      console.error('Error loading financial data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const handleMarkAsPaid = async (earningId) => {
    if (!confirm('Did the client pay for this service?')) return

    setProcessing(true)
    try {
      await workerFinanceService.markEarningAsPaid(earningId, 'cash')
      toast.success('✅ Payment recorded! Moved to Paid Balance.')
      loadFinancialData()
    } catch (error) {
      toast.error(error.message || 'Failed to update payment')
    } finally {
      setProcessing(false)
    }
  }

  const paymentScheduleLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Finances</h1>
        <p className="text-gray-600 mt-1">Track your earnings and payment history</p>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">💰 Net Available Balance</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(wallet?.netBalance !== undefined ? wallet.netBalance : Math.max(0, (wallet?.balance || 0) - (wallet?.outstandingAdvances || 0)))}
                </p>
                <p className="text-green-100 text-sm mt-1">
                  After advances deducted
                </p>
              </div>
              <CheckCircle size={48} className="text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">💳 Outstanding Advances</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(wallet?.outstandingAdvances || 0)}
                </p>
                <p className="text-purple-100 text-sm mt-1">
                  To be deducted from next payment
                </p>
              </div>
              <DollarSign size={48} className="text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">⏳ Unpaid Earnings</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(unpaidEarnings.reduce((sum, e) => sum + e.workerEarning, 0))}
                </p>
                <p className="text-orange-100 text-sm mt-1">
                  {unpaidEarnings.length} clients didn't pay
                </p>
              </div>
              <Clock size={48} className="text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">📅 Estimated This Week</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(estimatedEarnings?.thisWeekEstimated || 0)}
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  {estimatedEarnings?.appointmentsCount || 0} confirmed bookings
                </p>
              </div>
              <Calendar size={48} className="text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">💜 Paid Out This Month</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(wallet?.thisMonthPaidOut || 0)}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
              <Wallet size={40} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('paid')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'paid'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="inline mr-2" size={18} />
              Paid Earnings ({paidEarnings.length})
            </button>
            <button
              onClick={() => setActiveTab('unpaid')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'unpaid'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="inline mr-2" size={18} />
              Unpaid Earnings ({unpaidEarnings.length})
            </button>
            <button
              onClick={() => setActiveTab('estimated')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'estimated'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="inline mr-2" size={18} />
              Estimated This Week ({estimatedEarnings?.appointmentsCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="inline mr-2" size={18} />
              Payment History ({paymentHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'advances'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="inline mr-2" size={18} />
              Advances ({advances.filter(a => a.status === 'approved').length})
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {activeTab === 'paid' && (
            <div className="space-y-4">
              {paidEarnings.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No paid earnings yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Complete services and get paid to see earnings here
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Your Earning</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidEarnings.map((earning) => (
                        <tr key={earning._id} className="border-b border-gray-100 hover:bg-green-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <User className="text-green-600" size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {earning.appointmentId?.clientId?.name || 'Unknown Client'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {earning.appointmentId?.clientId?.phone || 'No phone'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(earning.serviceDate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {earning.serviceId?.name || 'Service'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {formatCurrency(earning.servicePrice)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                            {formatCurrency(earning.workerEarning)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="success">✅ Paid</Badge>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-green-50">
                        <td colSpan="4" className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                          Total Paid ({paidEarnings.length} clients):
                        </td>
                        <td className="py-3 px-4 text-lg font-bold text-green-600 text-right">
                          {formatCurrency(paidEarnings.reduce((sum, e) => sum + e.workerEarning, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'unpaid' && (
            <div className="space-y-4">
              {unpaidEarnings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No unpaid earnings yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Your earnings will appear here after completing appointments
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Your Earning</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidEarnings.map((earning) => (
                        <tr key={earning._id} className="border-b border-gray-100 hover:bg-orange-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <User className="text-orange-600" size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {earning.appointmentId?.clientId?.name || 'Unknown Client'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {earning.appointmentId?.clientId?.phone || 'No phone'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(earning.serviceDate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {earning.serviceId?.name || 'Service'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 text-right">
                            {formatCurrency(earning.servicePrice)}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-orange-600 text-right">
                            {formatCurrency(earning.workerEarning)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(earning._id)}
                              disabled={processing}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle size={14} />
                              Mark Paid
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-orange-50">
                        <td colSpan="4" className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                          Total Unpaid ({unpaidEarnings.length} clients):
                        </td>
                        <td className="py-3 px-4 text-lg font-bold text-orange-600 text-right">
                          {formatCurrency(unpaidEarnings.reduce((sum, e) => sum + e.workerEarning, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'estimated' && (
            <div className="space-y-4">
              {!estimatedEarnings || estimatedEarnings.appointmentsCount === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No confirmed appointments this week</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Future bookings will show estimated earnings here
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Estimated Earnings This Week</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Based on {estimatedEarnings.appointmentsCount} confirmed appointments ({estimatedEarnings.commissionPercentage}% commission)
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatCurrency(estimatedEarnings.thisWeekEstimated)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Service</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Est. Earning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimatedEarnings.breakdown.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-blue-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="text-blue-600" size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.clientName || 'Unknown'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.clientPhone || 'No phone'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(item.appointmentDate)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {item.serviceName}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 text-right">
                              {formatCurrency(item.servicePrice)}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-blue-600 text-right">
                              {formatCurrency(item.estimatedEarning)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50">
                          <td colSpan="4" className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                            Total Estimated ({estimatedEarnings.appointmentsCount} clients):
                          </td>
                          <td className="py-3 px-4 text-lg font-bold text-blue-600 text-right">
                            {formatCurrency(estimatedEarnings.thisWeekEstimated)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No payment history yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Your invoices and payments will appear here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {paymentHistory.map((invoice) => (
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
                                <p className="text-gray-600">Period</p>
                                <p className="text-gray-900 font-medium">
                                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Appointments</p>
                                <p className="text-gray-900 font-medium">
                                  {invoice.appointmentsCount} services
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Payment Method</p>
                                <p className="text-gray-900 font-medium capitalize">
                                  {invoice.paymentMethod.replace('_', ' ')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Paid Date</p>
                                <p className="text-gray-900 font-medium">
                                  {invoice.paidDate ? formatDate(invoice.paidDate) : 'Pending'}
                                </p>
                              </div>
                            </div>
                            {invoice.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <strong>Note:</strong> {invoice.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(invoice.totalAmount)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'advances' && (
            <div className="space-y-4">
              {advances.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No advances yet</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Advances given by the owner will appear here
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Outstanding Advances</p>
                        <p className="text-xs text-purple-600 mt-1">
                          These will be deducted from your next payment
                        </p>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {formatCurrency(advances.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0))}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Reason</th>
                          <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Deducted From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advances.map((advance) => (
                          <tr key={advance._id} className="border-b border-gray-100 hover:bg-purple-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(advance.givenAt)}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-purple-600">
                              {formatCurrency(advance.amount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {advance.reason || 'No reason provided'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge 
                                variant={
                                  advance.status === 'deducted' ? 'success' : 
                                  advance.status === 'approved' ? 'warning' : 
                                  'default'
                                }
                              >
                                {advance.status === 'deducted' ? 'Deducted' : 
                                 advance.status === 'approved' ? 'Outstanding' : 
                                 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {advance.invoiceId?.invoiceNumber || '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-purple-50">
                          <td colSpan="1" className="py-3 px-4 text-sm font-semibold text-gray-900 text-right">
                            Total Given:
                          </td>
                          <td className="py-3 px-4 text-lg font-bold text-purple-600">
                            {formatCurrency(advances.reduce((sum, a) => sum + a.amount, 0))}
                          </td>
                          <td colSpan="3"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkerFinancePage

