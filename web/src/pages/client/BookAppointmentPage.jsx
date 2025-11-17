import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { availabilityService } from '../../services/availabilityService'
import { appointmentService } from '../../services/appointmentService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import WorkerDetailsModal from '../../components/worker/WorkerDetailsModal'
import { 
  Calendar, Clock, User, Scissors, DollarSign, 
  ArrowLeft, CheckCircle 
} from 'lucide-react'
import { formatCurrency, formatDuration } from '../../utils/helpers'
import toast from 'react-hot-toast'

const BookAppointmentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const salonIdParam = searchParams.get('salon')
  const serviceIdParam = searchParams.get('service')

  // Default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [salonDetails, setSalonDetails] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)

  useEffect(() => {
    if (salonIdParam) {
      loadSalonDetails()
    }
  }, [salonIdParam])

  useEffect(() => {
    if (selectedWorker && selectedDate && selectedService) {
      loadAvailableSlots()
    }
  }, [selectedWorker, selectedDate, selectedService])

  const loadSalonDetails = async () => {
    try {
      const data = await salonSearchService.getSalonDetails(salonIdParam)
      setSalonDetails(data)
      
      // Pre-select service if provided
      if (serviceIdParam) {
        const service = data.services.find(s => s._id === serviceIdParam)
        if (service) {
          setSelectedService(service)
          setStep(2)
        }
      }
    } catch (error) {
      console.error('Error loading salon:', error)
      toast.error('Failed to load salon details')
      navigate('/search-salons')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const slots = await availabilityService.getWorkerTimeSlots(selectedWorker._id, {
        date: selectedDate,
        serviceId: selectedService._id
      })
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading slots:', error)
      toast.error('Failed to load available slots')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedWorker || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking steps')
      return
    }

    setBooking(true)
    try {
      // Create appointment
      const appointmentDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      console.log('Booking appointment:', {
        workerId: selectedWorker._id,
        serviceId: selectedService._id,
        dateTime: appointmentDateTime.toISOString()
      })

      await appointmentService.createAppointment({
        workerId: selectedWorker._id,
        serviceId: selectedService._id,
        dateTime: appointmentDateTime.toISOString(),
        notes: ''
      })

      toast.success('🎉 Appointment booked successfully!')
      setTimeout(() => {
        navigate('/appointments')
      }, 2000)
    } catch (error) {
      console.error('Error booking:', error)
      toast.error(error.response?.data?.message || 'Failed to book appointment')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-gray-600">{salonDetails?.salon.name}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Service', icon: Scissors },
              { num: 2, label: 'Worker', icon: User },
              { num: 3, label: 'Date & Time', icon: Calendar }
            ].map((s, idx) => {
              const Icon = s.icon
              return (
                <div key={s.num} className="flex items-center">
                  <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {s.num}
                    </div>
                    <span className="hidden md:block font-medium">{s.label}</span>
                    <Icon size={16} />
                  </div>
                  {idx < 2 && (
                    <div className={`w-12 md:w-24 h-1 mx-2 ${
                      step > s.num ? 'bg-primary-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Choose a Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salonDetails?.services.map((service) => (
                <div
                  key={service._id}
                  onClick={() => {
                    setSelectedService(service)
                    setStep(2)
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedService?._id === service._id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {service.image ? (
                      <img
                        src={uploadService.getImageUrl(service.image)}
                        alt={service.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <Scissors className="text-primary-300" size={24} />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      <Badge variant="default" size="sm">{service.category}</Badge>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        <span>⏱️ {formatDuration(service.duration)}</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Worker */}
      {step === 2 && selectedService && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Choose Your Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Selected Service:</p>
                <p className="font-semibold text-gray-900">{selectedService.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Duration: {formatDuration(selectedService.duration)} | Price: {formatCurrency(selectedService.price)}
                </p>
              </div>

              {/* Status Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Worker Status:</p>
                <p>• 🟢 Available = Online now, can accept bookings</p>
                <p>• ☕ On Break = Can book for later today or future dates</p>
                <p>• 🔴 Offline = Can book for future dates only</p>
              </div>

              {salonDetails?.workers.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No workers available</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {salonDetails?.workers.map((worker) => (
                      <div
                        key={worker._id}
                        onClick={() => {
                          setSelectedWorker(worker)
                          setStep(3)
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedWorker?._id === worker._id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {worker.avatar ? (
                            <img
                              src={uploadService.getImageUrl(worker.avatar)}
                              alt={worker.name}
                              className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedWorkerForDetails(worker)
                                setShowWorkerModal(true)
                              }}
                              title="Click to view details"
                            />
                          ) : (
                            <div 
                              className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedWorkerForDetails(worker)
                                setShowWorkerModal(true)
                              }}
                              title="Click to view details"
                            >
                              <User className="text-primary-600" size={28} />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">{worker.name}</h3>
                              {worker.currentStatus && (
                                <Badge 
                                  variant={
                                    worker.currentStatus === 'available' ? 'success' : 
                                    worker.currentStatus === 'on_break' ? 'warning' : 
                                    'default'
                                  }
                                >
                                  {worker.currentStatus === 'available' && '🟢 Available'}
                                  {worker.currentStatus === 'on_break' && '☕ On Break'}
                                  {worker.currentStatus === 'offline' && '🔴 Offline'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {worker.currentStatus === 'available' 
                                ? 'Online now - Tap to book' 
                                : 'Can book future appointments'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={() => setStep(1)} fullWidth>
                    Back
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Date & Time with Worker Availability */}
      {step === 3 && selectedWorker && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Choose Date & Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Worker Info */}
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                {selectedWorker.avatar ? (
                  <img
                    src={uploadService.getImageUrl(selectedWorker.avatar)}
                    alt={selectedWorker.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="text-primary-600" size={24} />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Your Worker:</p>
                  <p className="font-semibold text-gray-900">{selectedWorker.name}</p>
                </div>
              </div>

              {/* Date Selection */}
              <Input
                label="Appointment Date"
                type="date"
                min={minDate}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setSelectedTime('')
                }}
              />

              {/* Time Selection with Color Coding */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8 bg-red-50 border border-red-200 rounded-lg">
                      <Clock className="mx-auto text-red-400 mb-2" size={32} />
                      <p className="text-red-600 font-medium">No available slots for this date</p>
                      <p className="text-sm text-gray-600 mt-1">Try a different date</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time) => {
                          const slot = availableSlots.find(s => s.start === time)
                          const isAvailable = slot && slot.available
                          
                          return (
                            <button
                              key={time}
                              onClick={() => isAvailable && setSelectedTime(time)}
                              disabled={!isAvailable}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                selectedTime === time
                                  ? 'border-primary-500 bg-primary-100 text-primary-700 shadow-md'
                                  : isAvailable
                                    ? 'border-green-300 bg-green-50 text-green-700 hover:border-green-500 hover:shadow'
                                    : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <Clock size={16} className="mx-auto mb-1" />
                              <p className="font-semibold text-sm">{time}</p>
                              <p className="text-xs mt-1">
                                {isAvailable ? '✅' : '❌'}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                          <span className="text-gray-600">Available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                          <span className="text-gray-600">Not Available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-primary-100 border border-primary-500 rounded"></div>
                          <span className="text-gray-600">Selected</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        ⏰ 10-minute buffer applied (you can arrive up to 10 min late)
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime}
                  loading={booking}
                  fullWidth
                  className="btn-confirm-booking"
                >
                  <CheckCircle size={18} />
                  Confirm Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worker Details Modal */}
      <WorkerDetailsModal
        isOpen={showWorkerModal}
        onClose={() => {
          setShowWorkerModal(false)
          setSelectedWorkerForDetails(null)
        }}
        worker={selectedWorkerForDetails}
      />

      {/* Booking Summary */}
      {(step >= 2) && (
        <Card className="bg-primary-50 border-2 border-primary-200">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedService && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-semibold text-gray-900">{selectedService.name}</span>
                </div>
              )}
              
              {selectedDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}

              {selectedTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold text-gray-900">{selectedTime}</span>
                </div>
              )}
              
              {selectedWorker && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Worker:</span>
                  <span className="font-semibold text-gray-900">{selectedWorker.name}</span>
                </div>
              )}
              
              {selectedService && (
                <div className="flex items-center justify-between pt-3 border-t border-primary-300">
                  <span className="text-gray-700 font-medium">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedService.price)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BookAppointmentPage

