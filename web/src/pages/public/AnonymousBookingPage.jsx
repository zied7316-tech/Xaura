import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { appointmentService } from '../../services/appointmentService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import SafeImage from '../../components/ui/SafeImage'
import { MapPin, Phone, Mail, Calendar, Clock, Scissors, CheckCircle } from 'lucide-react'
import { formatCurrency, formatDuration } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AnonymousBookingPage = () => {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Get tomorrow as minimum date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  useEffect(() => {
    if (salonId) {
      loadSalonData()
    }
  }, [salonId])

  const loadSalonData = async () => {
    try {
      setLoading(true)
      const data = await salonSearchService.getSalonDetails(salonId)
      setSalon(data.salon)
      setServices(data.services || [])
    } catch (error) {
      console.error('Error loading salon:', error)
      toast.error('Failed to load salon information')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.serviceId === service._id)
      if (exists) {
        return prev.filter(s => s.serviceId !== service._id)
      } else {
        return [...prev, {
          serviceId: service._id,
          name: service.name,
          price: service.price,
          duration: service.duration
        }]
      }
    })
  }

  const handleDateChange = async (date) => {
    setSelectedDate(date)
    setSelectedTime('')
    setAvailableSlots([])
    
    if (date && selectedServices.length > 0) {
      // Calculate total duration
      const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)
      
      // Get available slots for the salon (without specific worker)
      // We'll generate time slots based on salon working hours
      try {
        const slots = generateTimeSlots(date, totalDuration)
        setAvailableSlots(slots)
      } catch (error) {
        console.error('Error generating slots:', error)
      }
    }
  }

  const generateTimeSlots = (date, duration) => {
    if (!salon || !salon.workingHours) return []
    
    const selectedDateObj = new Date(date)
    const dayOfWeek = selectedDateObj.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]
    const workingDay = salon.workingHours[dayName]
    
    // Check if workingDay exists, is not closed, and has valid open/close times
    if (!workingDay || workingDay.isClosed || !workingDay.open || !workingDay.close) {
      return []
    }
    
    // Validate that open and close are strings before splitting
    const openTime = String(workingDay.open).trim()
    const closeTime = String(workingDay.close).trim()
    
    if (!openTime || !closeTime || !openTime.includes(':') || !closeTime.includes(':')) {
      return []
    }
    
    const slots = []
    const [openHour, openMin] = openTime.split(':').map(Number)
    const [closeHour, closeMin] = closeTime.split(':').map(Number)
    
    // Validate parsed hours and minutes are valid numbers
    if (isNaN(openHour) || isNaN(openMin) || isNaN(closeHour) || isNaN(closeMin)) {
      return []
    }
    
    let currentHour = openHour
    let currentMin = openMin
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMin + duration <= closeMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      slots.push(timeString)
      
      currentMin += 30 // 30-minute intervals
      if (currentMin >= 60) {
        currentMin = 0
        currentHour++
      }
    }
    
    return slots
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!clientName.trim()) {
      toast.error('Please enter your name')
      return
    }
    
    if (!clientPhone.trim()) {
      toast.error('Please enter your phone number')
      return
    }
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service')
      return
    }
    
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    
    if (!selectedTime) {
      toast.error('Please select a time')
      return
    }
    
    try {
      setSubmitting(true)
      
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':')
      const dateTime = new Date(selectedDate)
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const bookingData = {
        salonId: salonId,
        services: selectedServices,
        dateTime: dateTime.toISOString(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        notes: ''
      }
      
      const response = await appointmentService.createAnonymousAppointment(bookingData)
      
      if (response.success) {
        setBookingSuccess(true)
        toast.success('Booking request submitted! The salon will contact you to confirm.')
      } else {
        toast.error(response.message || 'Failed to submit booking')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      toast.error(error.response?.data?.message || 'Failed to submit booking request')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Salon not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Request Submitted!</h2>
              <p className="text-gray-600">
                Thank you, {clientName}! Your booking request has been sent to {salon.name}.
              </p>
              <p className="text-gray-600 mt-2">
                The salon owner will review your request and contact you at {clientPhone} to confirm your appointment.
              </p>
            </div>
            <Button onClick={() => navigate('/')} fullWidth>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Salon Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <SafeImage
                  src={salon.logo ? uploadService.getImageUrl(salon.logo) : null}
                  alt={salon.name}
                  className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                  fallbackType="salon"
                />
              </div>
              
              {/* Salon Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{salon.name}</h1>
                
                {salon.description && (
                  <p className="text-gray-600 mb-4">{salon.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {salon.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="text-primary-600 mt-1" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Address</p>
                        <p className="text-sm text-gray-600">
                          {salon.address.street && `${salon.address.street}, `}
                          {salon.address.city}
                          {salon.address.state && `, ${salon.address.state}`}
                          {salon.address.zipCode && ` ${salon.address.zipCode}`}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {salon.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="text-primary-600 mt-1" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <a href={`tel:${salon.phone}`} className="text-sm text-primary-600 hover:text-primary-700">
                          {salon.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {salon.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="text-primary-600 mt-1" size={18} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <a href={`mailto:${salon.email}`} className="text-sm text-primary-600 hover:text-primary-700">
                          {salon.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book Your Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Information */}
              <div className="bg-primary-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                  <Input
                    label="Phone Number"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    type="tel"
                    required
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Select Services</h3>
                {services.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No services available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => {
                      const isSelected = selectedServices.some(s => s.serviceId === service._id)
                      return (
                        <button
                          key={service._id}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Scissors size={18} className="text-primary-600" />
                                <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              </div>
                              {service.description && (
                                <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {formatDuration(service.duration)}
                                </span>
                                <span className="font-semibold text-primary-600">
                                  {formatCurrency(service.price)}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="text-primary-600 flex-shrink-0" size={20} />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {selectedServices.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total:</span>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(totalPrice)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDuration(totalDuration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-primary-600" />
                  Select Date
                </h3>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={minDate}
                  required
                />
              </div>

              {/* Time Selection */}
              {selectedDate && selectedServices.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary-600" />
                    Select Time
                  </h3>
                  {availableSlots.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No available time slots for this date. Please select another date.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedTime === slot
                              ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                              : 'border-gray-200 hover:border-primary-300 text-gray-700'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={submitting}
                  disabled={!clientName || !clientPhone || selectedServices.length === 0 || !selectedDate || !selectedTime}
                >
                  Submit Booking Request
                </Button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  The salon owner will review your request and contact you to confirm your appointment.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AnonymousBookingPage

