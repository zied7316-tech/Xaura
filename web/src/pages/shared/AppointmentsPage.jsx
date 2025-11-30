import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { appointmentService } from '../../services/appointmentService'
import { appointmentManagementService } from '../../services/appointmentManagementService'
import { workerService } from '../../services/workerService'
import { uploadService } from '../../services/uploadService'
import chatService from '../../services/chatService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import ReviewModal from '../../components/reviews/ReviewModal'
import { Calendar, Clock, User, Store, Phone, Mail, Check, X, RefreshCw, Star, MessageSquare } from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers'
import { celebrateSuccess } from '../../utils/confetti'
import toast from 'react-hot-toast'

const AppointmentsPage = () => {
  const { user, isClient, isOwner, salon } = useAuth()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all') // 'all', 'normal', 'anonymous'
  const [workers, setWorkers] = useState([])
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState('')
  const [processing, setProcessing] = useState(false)
  const [messagingWorker, setMessagingWorker] = useState(null)
  const [workersWithAvailability, setWorkersWithAvailability] = useState([])
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  useEffect(() => {
    loadAppointments()
  }, [filter])

  useEffect(() => {
    if (isOwner && salon) {
      loadWorkers()
    }
  }, [isOwner, salon])

  const loadWorkers = async () => {
    try {
      const data = await workerService.getWorkers()
      setWorkers(data)
    } catch (error) {
      console.error('Error loading workers:', error)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await appointmentService.getAppointments(
        filter !== 'all' ? { status: filter } : {}
      )
      console.log('Loaded appointments:', data)
      // Ensure data is an array
      const appointmentsArray = Array.isArray(data) ? data : (data?.data || [])
      setAppointments(appointmentsArray)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error(error.message || 'Failed to load appointments')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptAppointment = async (appointmentId) => {
    setProcessing(true)
    try {
      await appointmentManagementService.acceptAppointment(appointmentId)
      // Mark related notifications as read
      try {
        const { notificationService } = await import('../../services/notificationService')
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('✅ Appointment accepted!')
      loadAppointments()
    } catch (error) {
      toast.error(error.message || 'Failed to accept appointment')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return
    
    setProcessing(true)
    try {
      await appointmentManagementService.rejectAppointment(appointmentId, 'Cancelled by owner')
      // Mark related notifications as read
      try {
        const { notificationService } = await import('../../services/notificationService')
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('❌ Appointment cancelled')
      loadAppointments()
    } catch (error) {
      toast.error(error.message || 'Failed to cancel appointment')
    } finally {
      setProcessing(false)
    }
  }

  const openReassignModal = async (appointment) => {
    setSelectedAppointment(appointment)
    setSelectedWorker(appointment.workerId?._id || '')
    setShowReassignModal(true)
    
    // Load workers with availability for this appointment time
    if (appointment && appointment.dateTime && workers.length > 0) {
      setLoadingAvailability(true)
      try {
        const availabilityChecks = await Promise.all(
          workers.map(async (worker) => {
            try {
              const availability = await workerService.checkWorkerAvailability(
                worker._id,
                appointment.dateTime,
                appointment._id // Exclude current appointment when checking conflicts
              )
              return {
                ...worker,
                availability: availability.isAvailable,
                currentStatus: availability.currentStatus,
                conflictReason: availability.conflictReason
              }
            } catch (error) {
              console.error(`Error checking availability for worker ${worker._id}:`, error)
              return {
                ...worker,
                availability: true, // Default to available if check fails
                currentStatus: worker.currentStatus || 'offline',
                conflictReason: ''
              }
            }
          })
        )
        setWorkersWithAvailability(availabilityChecks)
      } catch (error) {
        console.error('Error loading worker availability:', error)
        // Fallback to workers without availability info
        setWorkersWithAvailability(workers.map(w => ({
          ...w,
          availability: true,
          currentStatus: w.currentStatus || 'offline',
          conflictReason: ''
        })))
      } finally {
        setLoadingAvailability(false)
      }
    } else {
      // If no appointment time, just use workers as-is
      setWorkersWithAvailability(workers.map(w => ({
        ...w,
        availability: true,
        currentStatus: w.currentStatus || 'offline',
        conflictReason: ''
      })))
    }
  }

  const handleReassignWorker = async () => {
    if (!selectedWorker) {
      toast.error('Please select a worker')
      return
    }

    setProcessing(true)
    try {
      await appointmentManagementService.reassignAppointment(selectedAppointment._id, selectedWorker)
      toast.success('🔄 Appointment reassigned successfully!')
      setShowReassignModal(false)
      setSelectedAppointment(null)
      loadAppointments()
    } catch (error) {
      toast.error(error.message || 'Failed to reassign appointment')
    } finally {
      setProcessing(false)
    }
  }

  const handleReviewClick = (appointment) => {
    setSelectedAppointment(appointment)
    setShowReviewModal(true)
  }

  const handleReviewSubmitted = () => {
    loadAppointments()
    celebrateSuccess()
  }

  const handleMessageWorker = async (appointment) => {
    // Handle both populated (object) and non-populated (string) workerId
    const workerId = appointment.workerId?._id || appointment.workerId
    
    if (!workerId) {
      toast.error('Worker information not available')
      return
    }

    setMessagingWorker(appointment._id)
    try {
      // Get or create chat with the worker
      const chatData = await chatService.getOrCreateChat(
        workerId,
        null,
        appointment._id
      )
      
      // Navigate to messages page with chat ID
      navigate(`/messages?chatId=${chatData.data._id}`)
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Failed to start conversation with worker')
    } finally {
      setMessagingWorker(null)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      'Pending': { variant: 'warning', label: 'Pending' },
      'Confirmed': { variant: 'success', label: 'Confirmed' },
      'In Progress': { variant: 'default', label: 'In Progress' },
      'Completed': { variant: 'success', label: 'Completed' },
      'Cancelled': { variant: 'default', label: 'Cancelled' }
    }
    const { variant, label} = config[status] || config.Pending
    return <Badge variant={variant}>{label}</Badge>
  }

  // Filter by booking type
  const filteredAppointments = appointments.filter(apt => {
    if (bookingTypeFilter === 'all') return true
    if (bookingTypeFilter === 'anonymous') return apt.isAnonymous === true
    if (bookingTypeFilter === 'normal') return !apt.isAnonymous
    return true
  })

  // Split filtered appointments into categories
  const pendingRequests = filteredAppointments.filter(apt => apt.status === 'Pending')
  const confirmedAppointments = filteredAppointments.filter(apt => 
    ['Confirmed', 'In Progress'].includes(apt.status)
  )
  const pastAppointments = filteredAppointments.filter(apt => 
    ['Completed', 'Cancelled'].includes(apt.status)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Debug: Log owner status
  console.log('AppointmentsPage - isOwner:', isOwner, 'user role:', user?.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-1">View and manage your appointments</p>
      </div>

      {/* Booking Type Switcher - Only for owners */}
      {isOwner ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary-600" size={20} />
                <span className="font-medium text-gray-700">Filter by:</span>
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setBookingTypeFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    bookingTypeFilter === 'all'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setBookingTypeFilter('normal')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    bookingTypeFilter === 'normal'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setBookingTypeFilter('anonymous')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    bookingTypeFilter === 'anonymous'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🔗 Booking Link
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Debug: isOwner = {String(isOwner)}, user role = {user?.role || 'undefined'}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto text-yellow-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{pendingRequests.length}</p>
            <p className="text-gray-600 text-sm">Pending Requests</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{confirmedAppointments.length}</p>
            <p className="text-gray-600 text-sm">Confirmed Upcoming</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Store className="mx-auto text-purple-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{pastAppointments.length}</p>
            <p className="text-gray-600 text-sm">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⏳ Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((apt) => (
                <div key={apt._id} className={`p-4 border-2 rounded-lg transition-all ${
                  apt.isAnonymous 
                    ? 'border-purple-300 bg-purple-50 hover:border-purple-400 shadow-md' 
                    : 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Worker/Salon Info */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        apt.isAnonymous ? 'bg-purple-100' : 'bg-yellow-100'
                      }`}>
                        {isClient ? (
                          <Store className={apt.isAnonymous ? "text-purple-600" : "text-yellow-600"} size={24} />
                        ) : (
                          <User className={apt.isAnonymous ? "text-purple-600" : "text-yellow-600"} size={24} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        {isClient ? (
                          <>
                            <h3 className="font-semibold text-gray-900 text-lg">{apt.salonId?.name || 'Salon'}</h3>
                            <p className="text-sm text-gray-600">with {apt.workerId?.name || 'Worker'}</p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {apt.isAnonymous ? apt.clientName : (apt.clientId?.name || 'Client')}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {apt.isAnonymous 
                                ? `📞 ${apt.clientPhone || 'No phone'}` 
                                : (apt.clientId?.email || '')}
                            </p>
                            {apt.isAnonymous && (
                              <p className="text-xs text-amber-600 font-medium mt-1">
                                🔗 Anonymous Booking (from booking link)
                              </p>
                            )}
                            {isOwner && (
                              <p className="text-sm text-primary-600 font-medium mt-1">
                                👨‍💼 Worker: {apt.workerId?.name || 'Not assigned yet'}
                              </p>
                            )}
                          </>
                        )}
                        
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {apt.services && apt.services.length > 0
                            ? apt.services.map(s => s.name).join(', ')
                            : (apt.serviceId?.name || 'Service')}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>📅 {formatDate(apt.dateTime)}</span>
                          <span>🕐 {formatTime(apt.dateTime)}</span>
                          <span>⏱️ {apt.serviceDurationAtBooking} min</span>
                        </div>
                        
                        {/* Timeline for Owner - Pending */}
                        {isOwner && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-600 space-y-1">
                            <div className="font-semibold text-gray-700 mb-1">📋 Timeline:</div>
                            <div>🗓️ Booked: {formatDate(apt.createdAt)} at {formatTime(apt.createdAt)}</div>
                            <div className="text-amber-600">⏳ Waiting for worker confirmation...</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {formatCurrency(apt.servicePriceAtBooking)}
                      </p>
                      <Badge variant="warning">⏳ Awaiting Confirmation</Badge>
                      
                      {/* Owner Actions */}
                      {isOwner && (
                        <div className="mt-4 space-y-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptAppointment(apt._id)}
                            disabled={processing}
                            className="w-full"
                          >
                            <Check size={16} />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReassignModal(apt)}
                            disabled={processing}
                            className="w-full"
                          >
                            <RefreshCw size={16} />
                            Reassign Worker
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectAppointment(apt._id)}
                            disabled={processing}
                            className="w-full text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X size={16} />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Upcoming Appointments */}
      {confirmedAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Confirmed Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedAppointments.map((apt) => {
                // Debug: Check if button should show
                const shouldShowButton = isClient && (apt.workerId?._id || apt.workerId) && ['Confirmed', 'In Progress'].includes(apt.status)
                if (isClient && ['Confirmed', 'In Progress'].includes(apt.status)) {
                  console.log('Appointment debug:', {
                    appointmentId: apt._id,
                    status: apt.status,
                    workerId: apt.workerId,
                    workerId_id: apt.workerId?._id,
                    isClient,
                    shouldShowButton
                  })
                }
                return (
                <div key={apt._id} className={`p-4 border-2 rounded-lg transition-all ${
                  apt.isAnonymous
                    ? 'border-purple-300 bg-purple-50 hover:border-purple-400 shadow-md' 
                    : 'border-gray-200 hover:border-primary-300'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Worker/Salon Info */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                        apt.isAnonymous ? 'bg-purple-100' : 'bg-primary-100'
                      }`}>
                        {isClient ? (
                          <Store className={apt.isAnonymous ? "text-purple-600" : "text-primary-600"} size={24} />
                        ) : (
                          <User className={apt.isAnonymous ? "text-purple-600" : "text-primary-600"} size={24} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        {isClient ? (
                          <>
                            <h3 className="font-semibold text-gray-900 text-lg">{apt.salonId?.name || 'Salon'}</h3>
                            <p className="text-sm text-gray-600">with {apt.workerId?.name || 'Worker'}</p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {apt.isAnonymous ? apt.clientName : (apt.clientId?.name || 'Client')}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {apt.isAnonymous 
                                ? `📞 ${apt.clientPhone || 'No phone'}` 
                                : (apt.clientId?.email || '')}
                            </p>
                            {apt.isAnonymous && (
                              <p className="text-xs text-amber-600 font-medium mt-1">
                                🔗 Anonymous Booking (from booking link)
                              </p>
                            )}
                            {isOwner && (
                              <p className="text-sm text-primary-600 font-medium mt-1">
                                👨‍💼 Worker: {apt.workerId?.name || 'Not assigned yet'}
                              </p>
                            )}
                          </>
                        )}
                        
                        <p className="text-sm font-medium text-gray-900 mt-2">
                          {apt.services && apt.services.length > 0
                            ? apt.services.map(s => s.name).join(', ')
                            : (apt.serviceId?.name || 'Service')}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>📅 {formatDate(apt.dateTime)}</span>
                          <span>🕐 {formatTime(apt.dateTime)}</span>
                          <span>⏱️ {apt.serviceDurationAtBooking} min</span>
                        </div>
                        
                        {/* Timeline for Owner */}
                        {isOwner && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-xs text-gray-600 space-y-1">
                            <div className="font-semibold text-gray-700 mb-1">📋 Timeline:</div>
                            <div>🗓️ Booked: {formatDate(apt.createdAt)} at {formatTime(apt.createdAt)}</div>
                            {apt.acceptedAt && (
                              <div className="text-green-700">✅ Accepted: {formatDate(apt.acceptedAt)} at {formatTime(apt.acceptedAt)}</div>
                            )}
                            {apt.startedAt && (
                              <div className="text-blue-700">▶️ Started: {formatDate(apt.startedAt)} at {formatTime(apt.startedAt)}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600 mb-2">
                        {formatCurrency(apt.servicePriceAtBooking)}
                      </p>
                      {getStatusBadge(apt.status)}
                      
                      {/* Message Worker Button - Only for clients with confirmed appointments */}
                      {isClient && (apt.workerId?._id || apt.workerId) && ['Confirmed', 'In Progress'].includes(apt.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessageWorker(apt)}
                          disabled={messagingWorker === apt._id}
                          loading={messagingWorker === apt._id}
                          className="mt-3 w-full"
                        >
                          <MessageSquare size={16} />
                          Message Worker
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastAppointments.map((apt) => (
                <div key={apt._id} className={`p-3 border rounded-lg ${
                  apt.isAnonymous 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      {isClient ? (
                        <>
                          <p className="font-medium text-gray-900">{apt.salonId?.name || 'Salon'}</p>
                          <p className="text-sm text-gray-600">{apt.serviceId?.name || 'Service'}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-gray-900">
                            {apt.isAnonymous ? apt.clientName : (apt.clientId?.name || 'Client')}
                          </p>
                          <p className="text-sm text-gray-600">
                            {apt.services && apt.services.length > 0
                              ? apt.services.map(s => s.name).join(', ')
                              : (apt.serviceId?.name || 'Service')}
                          </p>
                          {apt.isAnonymous && (
                            <div className="mt-1">
                              <p className="text-xs text-purple-700 font-medium">📞 {apt.clientPhone || 'No phone'}</p>
                              <div className="mt-1 px-2 py-0.5 bg-purple-100 border border-purple-300 rounded-md inline-block">
                                <p className="text-xs text-purple-700 font-semibold">🔗 Anonymous Booking</p>
                              </div>
                            </div>
                          )}
                          {isOwner && (
                            <p className="text-xs text-primary-600 font-medium">👨‍💼 {apt.workerId?.name || 'Not assigned'}</p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(apt.dateTime)} at {formatTime(apt.dateTime)}
                      </p>
                      
                      {/* Timeline for Owner - Completed/Cancelled */}
                      {isOwner && (
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 space-y-1">
                          <div className="font-semibold text-gray-700">📋 Timeline:</div>
                          <div>🗓️ Booked: {formatDate(apt.createdAt)} {formatTime(apt.createdAt)}</div>
                          {apt.acceptedAt && (
                            <div>✅ Accepted: {formatDate(apt.acceptedAt)} {formatTime(apt.acceptedAt)}</div>
                          )}
                          {apt.rejectedAt && (
                            <div className="text-red-600">❌ Rejected: {formatDate(apt.rejectedAt)} {formatTime(apt.rejectedAt)}</div>
                          )}
                          {apt.startedAt && (
                            <div>▶️ Started: {formatDate(apt.startedAt)} {formatTime(apt.startedAt)}</div>
                          )}
                          {apt.completedAt && (
                            <div className="text-green-600">✔️ Completed: {formatDate(apt.completedAt)} {formatTime(apt.completedAt)}</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(apt.servicePriceAtBooking)}</p>
                      {getStatusBadge(apt.status)}
                      {isClient && apt.status === 'Completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewClick(apt)}
                          className="mt-2"
                        >
                          <Star size={14} />
                          Leave Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredAppointments.length === 0 && (
        <Card className="p-12 text-center">
          <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Appointments</h3>
          <p className="text-gray-600">
            {isClient 
              ? 'Book your first appointment to get started!' 
              : 'No appointments scheduled yet'}
          </p>
        </Card>
      )}

      {/* Reassign Worker Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => {
          setShowReassignModal(false)
          setSelectedAppointment(null)
        }}
        title="Reassign Worker"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Client: <span className="font-semibold text-gray-900">
              {selectedAppointment?.isAnonymous 
                ? `${selectedAppointment?.clientName} (📞 ${selectedAppointment?.clientPhone})`
                : selectedAppointment?.clientId?.name}
            </span></p>
            {selectedAppointment?.isAnonymous && (
              <p className="text-xs text-amber-600 font-medium mt-1">🔗 Anonymous Booking (from booking link)</p>
            )}
            <p className="text-sm text-gray-600 mt-1">Service: <span className="font-semibold text-gray-900">
              {selectedAppointment?.services && selectedAppointment.services.length > 0
                ? selectedAppointment.services.map(s => s.name).join(', ')
                : selectedAppointment?.serviceId?.name}
            </span></p>
            <p className="text-sm text-gray-600 mt-1">Date: <span className="font-semibold text-gray-900">{formatDate(selectedAppointment?.dateTime)} at {formatTime(selectedAppointment?.dateTime)}</span></p>
            <p className="text-sm text-gray-600 mt-2">Current Worker: <span className="font-semibold text-primary-600">{selectedAppointment?.workerId?.name || 'Not assigned yet'}</span></p>
          </div>

          {loadingAvailability ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Checking worker availability...</p>
            </div>
          ) : (
            <Select
              label="Select New Worker"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="">-- Choose Worker --</option>
              {(workersWithAvailability.length > 0 ? workersWithAvailability : workers).map((worker) => {
                const isCurrent = worker._id === selectedAppointment?.workerId?._id
                const isUnavailable = !worker.availability || worker.currentStatus === 'offline'
                const statusText = worker.currentStatus === 'available' ? '✅ Available' 
                  : worker.currentStatus === 'on_break' ? '☕ On Break'
                  : '🔴 Offline'
                const conflictText = worker.conflictReason ? ` - ${worker.conflictReason}` : ''
                
                return (
                  <option 
                    key={worker._id} 
                    value={worker._id}
                    disabled={isCurrent || isUnavailable}
                  >
                    {worker.name} {isCurrent ? '(Current)' : ''} {!isCurrent && `- ${statusText}${conflictText}`}
                  </option>
                )
              })}
            </Select>
          )}
          
          {/* Availability Info */}
          {!loadingAvailability && workersWithAvailability.length > 0 && (
            <div className="space-y-2">
              {workersWithAvailability.map((worker) => {
                if (worker._id === selectedAppointment?.workerId?._id) return null
                
                const statusColor = worker.currentStatus === 'available' ? 'text-green-600'
                  : worker.currentStatus === 'on_break' ? 'text-orange-600'
                  : 'text-red-600'
                
                return (
                  <div key={worker._id} className={`p-2 rounded text-xs ${
                    !worker.availability ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{worker.name}:</span>
                      <span className={statusColor}>
                        {worker.currentStatus === 'available' ? '✅ Available' 
                          : worker.currentStatus === 'on_break' ? '☕ On Break'
                          : '🔴 Offline'}
                      </span>
                    </div>
                    {!worker.availability && worker.conflictReason && (
                      <p className="text-red-600 text-xs mt-1">⚠️ {worker.conflictReason}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ If appointment is confirmed, it will be reset to pending for the new worker to accept.
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleReassignWorker}
              disabled={processing || !selectedWorker}
              loading={processing}
              className="flex-1"
            >
              <RefreshCw size={16} />
              Reassign to New Worker
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowReassignModal(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  )
}

export default AppointmentsPage
