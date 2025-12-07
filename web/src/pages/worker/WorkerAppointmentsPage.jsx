import { useState, useEffect } from 'react'
import { appointmentManagementService } from '../../services/appointmentManagementService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { 
  Clock, Calendar, User, CheckCircle, XCircle, 
  Play, DollarSign, AlertCircle, Edit 
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { playWorkerNotificationSound } from '../../utils/soundNotification'

const WorkerAppointmentsPage = () => {
  const [pendingAppointments, setPendingAppointments] = useState([])
  const [activeAppointments, setActiveAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  
  const [paymentData, setPaymentData] = useState({
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    finalPrice: ''
  })

  useEffect(() => {
    loadAppointments()
    // Refresh every 30 seconds
    const interval = setInterval(loadAppointments, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAppointments = async () => {
    try {
      const [pending, active] = await Promise.all([
        appointmentManagementService.getWorkerPendingAppointments(),
        appointmentManagementService.getWorkerActiveAppointments()
      ])
      
      setPendingAppointments(pending)
      setActiveAppointments(active)
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (appointmentId) => {
    try {
      await appointmentManagementService.acceptAppointment(appointmentId)
      // Mark related notifications as read
      try {
        const { notificationService } = await import('../../services/notificationService')
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('Appointment accepted!')
      loadAppointments()
    } catch (error) {
      toast.error('Failed to accept appointment')
    }
  }

  const handleReject = async (appointmentId) => {
    if (!confirm('Are you sure you want to reject this appointment?')) return
    
    try {
      await appointmentManagementService.rejectAppointment(appointmentId, 'Not available')
      // Mark related notifications as read
      try {
        const { notificationService } = await import('../../services/notificationService')
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('Appointment rejected')
      loadAppointments()
    } catch (error) {
      toast.error('Failed to reject appointment')
    }
  }

  const handleStart = async (appointmentId) => {
    try {
      await appointmentManagementService.startAppointment(appointmentId)
      toast.success('Service started!')
      loadAppointments()
    } catch (error) {
      toast.error('Failed to start service')
    }
  }

  const handleCompleteClick = (appointment) => {
    setSelectedAppointment(appointment)
    const originalPrice = appointment.servicePriceAtBooking || appointment.serviceId?.price || 0
    setPaymentData({ 
      paymentStatus: 'paid', 
      paymentMethod: 'cash',
      finalPrice: originalPrice.toString() 
    })
    setShowPaymentModal(true)
  }

  const handleCompleteAppointment = async () => {
    // Validate finalPrice
    if (!paymentData.finalPrice || parseFloat(paymentData.finalPrice) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    try {
      await appointmentManagementService.completeAppointment(
        selectedAppointment._id,
        {
          ...paymentData,
          finalPrice: parseFloat(paymentData.finalPrice)
        }
      )
      
      if (paymentData.paymentStatus === 'paid') {
        toast.success('✅ Service completed & payment recorded!')
      } else {
        toast.success('✅ Service completed, payment pending')
      }
      
      // Play notification sound for worker
      playWorkerNotificationSound()
      
      setShowPaymentModal(false)
      setSelectedAppointment(null)
      loadAppointments()
    } catch (error) {
      toast.error('Failed to complete appointment')
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      'Pending': { variant: 'warning', icon: Clock },
      'Confirmed': { variant: 'success', icon: CheckCircle },
      'In Progress': { variant: 'default', icon: Play },
      'Completed': { variant: 'success', icon: CheckCircle },
      'Cancelled': { variant: 'default', icon: XCircle }
    }
    const { variant, icon: Icon } = config[status] || config.Pending
    return (
      <Badge variant={variant}>
        <Icon size={12} className="mr-1" />
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-1">Manage booking requests and complete services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="mx-auto text-orange-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-orange-600">{pendingAppointments.length}</p>
            <p className="text-gray-600 text-sm">Pending Requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-green-600">{activeAppointments.length}</p>
            <p className="text-gray-600 text-sm">Confirmed Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertCircle className="inline mr-2" size={18} />
              Pending Requests ({pendingAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'active'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CheckCircle className="inline mr-2" size={18} />
              Confirmed Upcoming ({activeAppointments.length})
            </button>
          </div>
        </div>

        <CardContent className="p-6">
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {pendingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No pending requests</p>
                </div>
              ) : (
                pendingAppointments.map((apt) => (
                  <Card key={apt._id} className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      {/* BEFORE ACCEPTANCE - Show only client name */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-3 shadow-sm">
                          {apt.clientId?.avatar ? (
                            <img
                              src={uploadService.getImageUrl(apt.clientId.avatar)}
                              alt={apt.clientId?.name || 'Client'}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <User className="text-primary-600" size={40} />
                          )}
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          {apt.clientId?.name || 'New Client'}
                        </h3>
                        <p className="text-sm text-gray-600">wants to book with you</p>
                        
                        <div className="mt-4 inline-block">
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-center">
                        <p className="text-sm text-yellow-800">
                          🔒 Accept to see appointment details (time, service, price)
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAccept(apt._id)}
                          fullWidth
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle size={18} />
                          Accept Request
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(apt._id)}
                          fullWidth
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle size={18} />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'active' && (
            <div className="space-y-4">
              {activeAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No confirmed appointments</p>
                </div>
              ) : (
                activeAppointments.map((apt) => (
                  <Card key={apt._id} className="border-2 border-green-200">
                    <CardContent className="p-4">
                      {/* AFTER ACCEPTANCE - Show full details */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          {apt.clientId?.avatar ? (
                            <img
                              src={uploadService.getImageUrl(apt.clientId.avatar)}
                              alt={apt.clientId?.name || 'Client'}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="text-primary-600" size={24} />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{apt.clientId?.name || 'Client'}</h3>
                            <p className="text-sm text-gray-600">{apt.serviceId?.name || 'Service'}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>📅 {formatDate(apt.dateTime)}</span>
                              <span>🕐 {formatTime(apt.dateTime)}</span>
                              <span>⏱️ {apt.serviceDurationAtBooking} min</span>
                            </div>
                            {apt.clientId?.phone && (
                              <p className="text-sm text-gray-600 mt-1">📞 {apt.clientId.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(apt.servicePriceAtBooking)}
                          </p>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {apt.status === 'Confirmed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStart(apt._id)}
                              fullWidth
                            >
                              <Play size={16} />
                              Start Service
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(apt._id)}
                              fullWidth
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        
                        {apt.status === 'In Progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteClick(apt)}
                            fullWidth
                          >
                            <CheckCircle size={16} />
                            Complete & Process Payment
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedAppointment(null)
        }}
        title="Complete Appointment"
        size="md"
      >
            {selectedAppointment && (
          <div className="space-y-4">
            {/* Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Service Details</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Client:</strong> {selectedAppointment.clientId?.name || 'Client'}</p>
                <p><strong>Service:</strong> {selectedAppointment.serviceId?.name || 'Service'}</p>
                <p><strong>Original Price:</strong> <span className="text-lg font-semibold text-gray-700">{formatCurrency(selectedAppointment.servicePriceAtBooking || selectedAppointment.serviceId?.price || 0)}</span></p>
              </div>
            </div>

            {/* Price Adjustment */}
            <div>
              <Input
                label={
                  <span className="flex items-center gap-2">
                    <Edit size={16} />
                    Final Price (Adjust if client changed service)
                  </span>
                }
                type="number"
                step="0.01"
                min="0"
                required
                value={paymentData.finalPrice}
                onChange={(e) => setPaymentData({ ...paymentData, finalPrice: e.target.value })}
                helperText="Change this if client added/removed services or you adjusted the price"
              />
              {paymentData.finalPrice && parseFloat(paymentData.finalPrice) !== (selectedAppointment.servicePriceAtBooking || selectedAppointment.serviceId?.price) && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm text-yellow-800">
                  <p className="font-semibold">⚠️ Price changed!</p>
                  <p>
                    From: {formatCurrency(selectedAppointment.servicePriceAtBooking || selectedAppointment.serviceId?.price || 0)} 
                    {' → '}
                    To: {formatCurrency(parseFloat(paymentData.finalPrice) || 0)}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentData({ ...paymentData, paymentStatus: 'paid' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentData.paymentStatus === 'paid'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <CheckCircle className={`mx-auto mb-2 ${paymentData.paymentStatus === 'paid' ? 'text-green-600' : 'text-gray-400'}`} size={32} />
                  <p className="font-semibold text-gray-900">Client Paid</p>
                  <p className="text-xs text-gray-600 mt-1">Add to wallet & finances</p>
                </button>

                <button
                  onClick={() => setPaymentData({ ...paymentData, paymentStatus: 'waiting' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentData.paymentStatus === 'waiting'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <Clock className={`mx-auto mb-2 ${paymentData.paymentStatus === 'waiting' ? 'text-orange-600' : 'text-gray-400'}`} size={32} />
                  <p className="font-semibold text-gray-900">Waiting Payment</p>
                  <p className="text-xs text-gray-600 mt-1">Payment pending</p>
                </button>
              </div>
            </div>

            {/* Payment Method (only if paid) */}
            {paymentData.paymentStatus === 'paid' && (
              <Select
                label="Payment Method"
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'other', label: 'Other' }
                ]}
              />
            )}

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              {paymentData.paymentStatus === 'paid' ? (
                <p>💰 Payment will be added to your wallet and salon finances</p>
              ) : (
                <p>⏳ Payment will remain pending. Client can pay later.</p>
              )}
              <p className="mt-1">✅ You will be set back to "Available" status after completing</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleCompleteAppointment} fullWidth>
                <CheckCircle size={18} />
                Complete Appointment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false)
                  setSelectedAppointment(null)
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerAppointmentsPage

