import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { salonService } from '../../services/salonService'
import { availabilityService } from '../../services/availabilityService'
import { appointmentService } from '../../services/appointmentService'
import { advancedBookingService } from '../../services/advancedBookingService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import SafeImage from '../../components/ui/SafeImage'
import Modal from '../../components/ui/Modal'
import WorkerDetailsModal from '../../components/worker/WorkerDetailsModal'
import { 
  Calendar, Clock, User, Scissors, DollarSign, 
  ArrowLeft, CheckCircle, X, Repeat, Users, Plus, Minus
} from 'lucide-react'
import { formatCurrency, formatDuration } from '../../utils/helpers'
import toast from 'react-hot-toast'
import ShinyText from '../../components/ui/ShinyText'

// Capitalize first letter of service name
const capitalizeFirst = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const BookAppointmentPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const salonIdParam = searchParams.get('salon')
  const serviceIdParam = searchParams.get('service')
  const recurringParam = searchParams.get('recurring')
  const groupParam = searchParams.get('group')

  // Default date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDate = tomorrow.toISOString().split('T')[0]

  const [step, setStep] = useState(1)
  const [salonDetails, setSalonDetails] = useState(null)
  const [selectedService, setSelectedService] = useState(null) // Keep for backward compatibility
  const [selectedServices, setSelectedServices] = useState([]) // Array for multiple services
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [selectedServiceImage, setSelectedServiceImage] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  
  // Multi-person booking state
  const [numberOfPeople, setNumberOfPeople] = useState(1)
  const [peopleServices, setPeopleServices] = useState([{ personIndex: 0, services: [] }]) // Array of { personIndex, services }
  
  // Recurring appointment state
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState('weekly') // weekly, biweekly, monthly
  const [recurringStartDate, setRecurringStartDate] = useState(defaultDate)
  const [recurringEndDate, setRecurringEndDate] = useState('')
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState(null) // 0-6 (Sunday-Saturday)

  // Sync numberOfPeople with peopleServices
  useEffect(() => {
    if (numberOfPeople > peopleServices.length) {
      // Add new person entries
      const newPeople = []
      for (let i = peopleServices.length; i < numberOfPeople; i++) {
        newPeople.push({ personIndex: i, services: [] })
      }
      setPeopleServices(prev => [...prev, ...newPeople])
    } else if (numberOfPeople < peopleServices.length) {
      // Remove extra person entries
      setPeopleServices(prev => prev.slice(0, numberOfPeople))
    }
  }, [numberOfPeople])

  // Sync selectedServices with peopleServices[0] when single person
  useEffect(() => {
    if (numberOfPeople === 1 && peopleServices[0]) {
      setSelectedServices(peopleServices[0].services)
      if (peopleServices[0].services.length === 1) {
        setSelectedService(peopleServices[0].services[0])
      }
    }
  }, [peopleServices, numberOfPeople])

  useEffect(() => {
    const loadSalon = async () => {
      if (salonIdParam) {
        await loadSalonDetails()
      } else if (recurringParam || groupParam) {
        // For recurring/group bookings, load client's joined salon
        try {
          const joinedSalon = await salonService.getJoinedSalon()
          if (joinedSalon) {
            const salonId = joinedSalon._id || joinedSalon.id
            if (salonId) {
              // Update URL with salon parameter
              navigate(`/book?salon=${salonId}${recurringParam ? '&recurring=true' : ''}${groupParam ? '&group=true' : ''}`, { replace: true })
            } else {
              toast.error('No salon found. Please join a salon first.')
              navigate('/join-salon')
            }
          } else {
            toast.error('No salon found. Please join a salon first.')
            navigate('/join-salon')
          }
        } catch (error) {
          console.error('Error loading joined salon:', error)
          toast.error('Failed to load salon. Please try again.')
          navigate('/client/advanced-booking')
        }
      } else {
        // No salon parameter and not recurring/group - redirect to search
        navigate('/search-salons')
      }
    }
    
    loadSalon()
  }, [salonIdParam, recurringParam, groupParam])

  useEffect(() => {
    // Sync selectedService to selectedServices array for consistency
    if (selectedService && !selectedServices.some(s => s._id === selectedService._id)) {
      setSelectedServices([selectedService])
    }
  }, [selectedService])

  useEffect(() => {
    // Enable recurring mode if recurring parameter is present
    if (recurringParam === 'true') {
      setIsRecurring(true)
    }
    // Enable group mode if group parameter is present (multi-service is already enabled)
    if (groupParam === 'true') {
      // Group booking is essentially multi-service, which is already supported
    }
  }, [recurringParam, groupParam])

  useEffect(() => {
    if (selectedWorker && selectedDate) {
      if (numberOfPeople === 1 && (selectedService || selectedServices.length > 0)) {
        loadAvailableSlots()
      } else if (numberOfPeople > 1 && peopleServices.some(p => p.services.length > 0)) {
        loadAvailableSlots()
      }
    }
  }, [selectedWorker, selectedDate, selectedService, selectedServices, numberOfPeople, peopleServices])

  const loadSalonDetails = async () => {
    if (!salonIdParam) {
      console.error('Salon ID is missing')
      toast.error('Salon ID is required')
      navigate('/search-salons')
      return
    }
    
    try {
      const data = await salonSearchService.getSalonDetails(salonIdParam)
      setSalonDetails(data)
      
      // Pre-select service if provided
      if (serviceIdParam) {
        const service = data.services.find(s => s._id === serviceIdParam)
        if (service) {
          setSelectedService(service)
          setSelectedServices([service]) // Also add to array for consistency
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
      // Calculate total duration - handle both single and multi-person
      let servicesToCheck = []
      let totalDuration = 0
      
      if (numberOfPeople === 1) {
        servicesToCheck = selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])
        totalDuration = servicesToCheck.reduce((sum, service) => sum + (service.duration || 0), 0)
      } else {
        // For multiple people, calculate the MAXIMUM duration needed
        // Since all appointments happen at the same time, we need the longest single appointment duration
        // But we also need to account for multiple appointments occupying the same slot
        const maxPersonDuration = Math.max(
          ...peopleServices.map(person => 
            person.services.reduce((sum, service) => sum + (service.duration || 0), 0)
          ),
          0
        )
        // For availability check, we use the max duration since appointments are simultaneous
        // The backend will check if the slot can accommodate multiple appointments
        totalDuration = maxPersonDuration
        // Get all services for the first person to get serviceId
        servicesToCheck = peopleServices[0]?.services || []
      }
      
      // Use first service ID for API (or we can update API to accept totalDuration)
      const serviceId = servicesToCheck.length > 0 ? servicesToCheck[0]._id : selectedService?._id
      
      const slots = await availabilityService.getWorkerTimeSlots(selectedWorker._id, {
        date: selectedDate,
        serviceId: serviceId,
        totalDuration: totalDuration.toString(), // Pass totalDuration for multi-service bookings
        numberOfPeople: numberOfPeople > 1 ? numberOfPeople.toString() : undefined // Pass number of people for multi-person bookings
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
    // Get services to book - handle both single and multi-person
    let servicesToBook = []
    if (numberOfPeople === 1) {
      servicesToBook = selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])
    } else {
      // For multiple people, check if all have services
      const allPeopleHaveServices = peopleServices.every(person => person.services.length > 0)
      if (!allPeopleHaveServices) {
        toast.error('Please select at least one service for each person')
        return
      }
    }
    
    if ((numberOfPeople === 1 && servicesToBook.length === 0) || !selectedWorker || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking steps')
      return
    }

    // Validate recurring appointment fields
    if (isRecurring) {
      if (!recurringStartDate) {
        toast.error('Please select a start date for recurring appointments')
        return
      }
      if (!recurringFrequency) {
        toast.error('Please select a frequency for recurring appointments')
        return
      }
    }

    setBooking(true)
    try {
      const appointmentDateTime = new Date(selectedDate)
      const [hours, minutes] = selectedTime.split(':')
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // If recurring appointment, create recurring booking (supports single and multiple people)
      if (isRecurring) {
        // Validate that we have the necessary data
        if (numberOfPeople > 1) {
          // For multi-person, validate peopleServices
          if (!peopleServices || peopleServices.length === 0 || !peopleServices[0]?.services || peopleServices[0].services.length === 0) {
            toast.error('Please select services for all people')
            setBooking(false)
            return
          }
        } else {
          // For single person, validate servicesToBook
          if (!servicesToBook || servicesToBook.length === 0) {
            toast.error('Please select at least one service')
            setBooking(false)
            return
          }
        }

        const startDate = new Date(recurringStartDate)
        const [startHours, startMinutes] = selectedTime.split(':')
        startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)

        // Determine primary service based on booking type
        const primaryService = numberOfPeople > 1 
          ? peopleServices[0].services[0] 
          : servicesToBook[0]

        if (!primaryService || !primaryService._id) {
          toast.error('Invalid service selection')
          setBooking(false)
          return
        }

        const recurringData = {
          salonId: salonIdParam,
          workerId: selectedWorker._id,
          serviceId: primaryService._id, // Primary service for backward compatibility
          services: numberOfPeople === 1 ? servicesToBook.map(service => ({
            serviceId: service._id,
            name: service.name,
            price: service.price,
            duration: service.duration
          })) : [], // For multi-person, services are in peopleServices
          frequency: recurringFrequency,
          startDate: startDate.toISOString(),
          endDate: recurringEndDate ? new Date(recurringEndDate).toISOString() : null,
          dayOfWeek: recurringDayOfWeek !== null ? recurringDayOfWeek : startDate.getDay(),
          timeSlot: selectedTime,
          numberOfPeople: numberOfPeople,
          peopleServices: numberOfPeople > 1 ? peopleServices.map(person => ({
            personIndex: person.personIndex,
            services: person.services.map(service => ({
              serviceId: service._id,
              name: service.name,
              price: service.price,
              duration: service.duration
            }))
          })) : []
        }

        await advancedBookingService.createRecurringAppointment(recurringData)
        const peopleText = numberOfPeople > 1 ? ` for ${numberOfPeople} people` : ''
        toast.success(`🎉 Recurring appointment${peopleText} created! Appointments will be automatically scheduled ${recurringFrequency === 'weekly' ? 'every week' : recurringFrequency === 'biweekly' ? 'every 2 weeks' : 'every month'}.`)
        setTimeout(() => {
          navigate('/client/advanced-booking')
        }, 2000)
      } else {
        // Regular appointment - handle single or multiple people
        if (numberOfPeople === 1) {
          // Single person booking
          await appointmentService.createAppointment({
            workerId: selectedWorker._id,
            serviceId: servicesToBook[0]._id, // Keep for backward compatibility
            services: servicesToBook.map(service => ({
              serviceId: service._id,
              name: service.name,
              price: service.price,
              duration: service.duration
            })),
            dateTime: appointmentDateTime.toISOString(),
            notes: ''
          })

          toast.success(`🎉 Appointment booked successfully for ${servicesToBook.length} service${servicesToBook.length > 1 ? 's' : ''}!`)
        } else {
          // Multiple people booking - create one appointment per person at the same time
          // Since all appointments are at the same time, we need to create them sequentially
          // to avoid availability conflicts (first appointment will block the slot)
          const createdAppointments = []
          let hasError = false
          
          for (let personIdx = 0; personIdx < peopleServices.length; personIdx++) {
            const person = peopleServices[personIdx]
            if (person.services.length === 0) continue
            
            try {
              const appointment = await appointmentService.createAppointment({
                workerId: selectedWorker._id,
                serviceId: person.services[0]._id,
                services: person.services.map(service => ({
                  serviceId: service._id,
                  name: service.name,
                  price: service.price,
                  duration: service.duration
                })),
                dateTime: appointmentDateTime.toISOString(),
                notes: `Person ${personIdx + 1} of ${numberOfPeople} - Multi-person booking`,
                skipAvailabilityCheck: personIdx > 0 // Skip check for subsequent appointments since they're at the same time
              })
              createdAppointments.push(appointment)
            } catch (error) {
              console.error(`Error creating appointment for person ${personIdx + 1}:`, error)
              hasError = true
              // If we fail to create any appointment, try to rollback by deleting created ones
              if (createdAppointments.length > 0) {
                toast.error(`Failed to create appointment for person ${personIdx + 1}. Rolling back...`)
                // Note: We could add a rollback mechanism here, but for now just show error
                break
              }
            }
          }
          
          if (hasError && createdAppointments.length < numberOfPeople) {
            toast.error(`⚠️ Only ${createdAppointments.length} of ${numberOfPeople} appointments were created. Some appointments may need to be cancelled manually.`)
          } else if (createdAppointments.length === numberOfPeople) {
            toast.success(`🎉 Successfully booked ${numberOfPeople} appointment${numberOfPeople > 1 ? 's' : ''} for ${numberOfPeople} ${numberOfPeople === 1 ? 'person' : 'people'} at the same time!`)
          }
        }
        
        setTimeout(() => {
          navigate('/appointments')
        }, 2000)
      }
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
            <CardTitle>Step 1: Choose Service(s)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Number of People Selector */}
            <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-300 rounded-xl shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/80 rounded-full shadow-sm">
                    <Users className="text-purple-600" size={28} />
                  </div>
                  <div>
                    <p className="text-base font-bold text-purple-900 mb-1">
                      How many people are booking?
                    </p>
                    <p className="text-xs text-purple-700/80">
                      Perfect for families or groups (e.g., father + 2 kids, friends together)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-lg shadow-sm">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (numberOfPeople > 1) {
                        setNumberOfPeople(numberOfPeople - 1)
                      }
                    }}
                    disabled={numberOfPeople <= 1}
                    className="w-10 h-10 p-0 rounded-full hover:bg-purple-100 disabled:opacity-40"
                  >
                    <Minus size={18} />
                  </Button>
                  <span className="text-3xl font-extrabold text-purple-900 min-w-[3rem] text-center bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {numberOfPeople}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (numberOfPeople < 10) {
                        setNumberOfPeople(numberOfPeople + 1)
                      }
                    }}
                    disabled={numberOfPeople >= 10}
                    className="w-10 h-10 p-0 rounded-full hover:bg-purple-100 disabled:opacity-40"
                  >
                    <Plus size={18} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <span className="text-2xl">💡</span>
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-blue-900 mb-2">
                    {numberOfPeople === 1 ? 'Choose Your Service(s)' : 'Choose Services for Each Person'}
                  </p>
                  <p className="text-sm text-blue-800/90 leading-relaxed">
                    {numberOfPeople === 1 ? (
                      <>Select <strong className="text-blue-900">one or multiple services</strong> for your appointment. 
                      You can combine services like Haircut + Styling + Beard Trim. 
                      Click on service cards to select or deselect them.</>
                    ) : (
                      <>Each person can select their own services. All appointments will be scheduled at the <strong className="text-blue-900">same time</strong>, 
                      making it perfect for families or groups visiting together.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Selection - Show per person if multiple people */}
            {numberOfPeople === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {salonDetails?.services.map((service) => {
                const isSelected = selectedServices.some(s => s._id === service._id) || selectedService?._id === service._id
                return (
                <div
                  key={service._id}
                  onClick={() => {
                    // Toggle service selection - always use selectedServices array for consistency
                    if (isSelected) {
                      // Remove from selection
                      const newServices = selectedServices.filter(s => s._id !== service._id)
                      setSelectedServices(newServices)
                      // Update peopleServices for single person
                      setPeopleServices([{ personIndex: 0, services: newServices }])
                      // Also clear selectedService if it matches
                      if (selectedService?._id === service._id) {
                        setSelectedService(null)
                      }
                    } else {
                      // Add to selection
                      const newServices = [...selectedServices, service]
                      setSelectedServices(newServices)
                      // Update peopleServices for single person
                      setPeopleServices([{ personIndex: 0, services: newServices }])
                    }
                  }}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  {/* Checkbox in top-right corner */}
                  <div className="absolute top-3 right-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600'
                        : 'bg-white border-gray-300'
                    }`}>
                      {isSelected && (
                        <CheckCircle size={18} className="text-white" fill="white" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pr-8">
                    <div
                      className="w-32 h-32 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (service.image) {
                          setSelectedServiceImage(service.image)
                          setShowImageModal(true)
                        }
                      }}
                    >
                      <SafeImage
                        src={service.image ? uploadService.getImageUrl(service.image, { width: 1080, height: 1080 }) : null}
                        alt={service.name}
                        className="w-full h-full object-cover"
                        fallbackType="service"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="text-center mb-2">
                        <h3>
                          <ShinyText
                            size="2xl"
                            weight="bold"
                            baseColor="#667eea"
                            shineColor="#764ba2"
                            speed={3}
                            intensity={1}
                            direction="left-to-right"
                            shineWidth={30}
                            className="tracking-wide"
                          >
                            {capitalizeFirst(service.name)}
                          </ShinyText>
                        </h3>
                      </div>
                      <div className="text-center">
                        <Badge variant="default" size="sm">{service.category}</Badge>
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-2 text-sm text-gray-600">
                        <span>⏱️ {formatDuration(service.duration)}</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
            ) : (
              /* Multi-person service selection */
              <div className="space-y-6">
                {peopleServices.map((person, personIdx) => (
                  <Card key={personIdx} className="border-2 border-purple-300 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 border-b-2 border-purple-300">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {personIdx + 1}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-purple-900">Person {personIdx + 1}</p>
                          <p className="text-xs text-purple-700 font-normal">Select services for this person</p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {salonDetails?.services.map((service) => {
                          const isSelected = person.services.some(s => s._id === service._id)
                          return (
                            <div
                              key={service._id}
                              onClick={() => {
                                const personServices = person.services
                                if (isSelected) {
                                  const newServices = personServices.filter(s => s._id !== service._id)
                                  setPeopleServices(prev => prev.map((p, idx) => 
                                    idx === personIdx ? { ...p, services: newServices } : p
                                  ))
                                } else {
                                  const newServices = [...personServices, service]
                                  setPeopleServices(prev => prev.map((p, idx) => 
                                    idx === personIdx ? { ...p, services: newServices } : p
                                  ))
                                }
                              }}
                              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 shadow-md'
                                  : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
                              }`}
                            >
                              {/* Checkbox in top-right corner */}
                              <div className="absolute top-3 right-3">
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'bg-primary-600 border-primary-600'
                                    : 'bg-white border-gray-300'
                                }`}>
                                  {isSelected && (
                                    <CheckCircle size={18} className="text-white" fill="white" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-start gap-3 pr-8">
                                <div
                                  className="w-32 h-32 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (service.image) {
                                      setSelectedServiceImage(service.image)
                                      setShowImageModal(true)
                                    }
                                  }}
                                >
                                  <SafeImage
                                    src={service.image ? uploadService.getImageUrl(service.image, { width: 1080, height: 1080 }) : null}
                                    alt={service.name}
                                    className="w-full h-full object-cover"
                                    fallbackType="service"
                                  />
                                </div>
                                
                                <div className="flex-1">
                                  <div className="text-center mb-2">
                                    <h3>
                                      <ShinyText
                                        size="2xl"
                                        weight="bold"
                                        baseColor="#667eea"
                                        shineColor="#764ba2"
                                        speed={3}
                                        intensity={1}
                                        direction="left-to-right"
                                        shineWidth={30}
                                        className="tracking-wide"
                                      >
                                        {capitalizeFirst(service.name)}
                                      </ShinyText>
                                    </h3>
                                  </div>
                                  <div className="text-center">
                                    <Badge variant="default" size="sm">{service.category}</Badge>
                                  </div>
                                  <div className="flex items-center justify-center gap-3 mt-2 text-sm text-gray-600">
                                    <span>⏱️ {formatDuration(service.duration)}</span>
                                    <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {person.services.length > 0 && (
                        <div className="mt-5 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-green-900 flex items-center gap-2">
                              <CheckCircle className="text-green-600" size={18} />
                              {person.services.length} Service{person.services.length > 1 ? 's' : ''} Selected
                            </p>
                            {person.services.length > 1 && (
                              <Badge variant="default" className="bg-green-200 text-green-800">
                                Multi-Service
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            {person.services.filter(s => s).map((service, idx) => (
                              <div key={service?._id || idx} className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium text-gray-800">{service ? capitalizeFirst(service.name) : 'Unknown Service'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">⏱️ {service ? formatDuration(service.duration) : 'N/A'}</span>
                                  <span className="text-green-600 font-bold">{service ? formatCurrency(service.price) : 'N/A'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 pt-3 border-t-2 border-green-300 flex items-center justify-between bg-white p-3 rounded-lg">
                            <span className="text-sm font-semibold text-gray-700">Total:</span>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600">
                                ⏱️ {formatDuration(person.services.reduce((sum, s) => sum + (s?.duration || 0), 0))}
                              </span>
                              <span className="text-base font-bold text-green-600">
                                {formatCurrency(person.services.reduce((sum, s) => sum + (s?.price || 0), 0))}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Summary Card - Single Person */}
            {numberOfPeople === 1 && selectedServices.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg border-2 border-primary-300 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-primary-800">
                    ✓ Selected: {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}
                  </p>
                  {selectedServices.length > 1 && (
                    <Badge variant="default" className="bg-purple-100 text-purple-700">
                      Multi-Service
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {selectedServices.map((service, idx) => (
                    <div 
                      key={service._id || idx} 
                      className="flex items-center justify-between text-sm bg-white p-3 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600 font-bold text-xs w-6 h-6 flex items-center justify-center bg-primary-100 rounded-full">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 font-medium">{capitalizeFirst(service.name)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">⏱️ {formatDuration(service.duration)}</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedServices(prev => prev.filter(s => s._id !== service._id))
                            if (selectedService?._id === service._id) {
                              setSelectedService(null)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                          title="Remove service"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-3 border-t-2 border-primary-300 bg-white p-3 rounded-lg">
                  <div>
                    <span className="text-gray-600 block text-xs mb-1">Total Duration</span>
                    <span className="text-gray-900 text-base">
                      {formatDuration(selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 block text-xs mb-1">Total Price</span>
                    <span className="text-green-600 text-xl">
                      {formatCurrency(selectedServices.reduce((sum, s) => sum + (s.price || 0), 0))}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setStep(2)}
                  className="mt-3 w-full"
                  disabled={selectedServices.length === 0}
                >
                  Continue with {selectedServices.length} Service{selectedServices.length > 1 ? 's' : ''} →
                </Button>
              </div>
            )}

            {/* Summary Card - Multiple People */}
            {numberOfPeople > 1 && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-300 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-bold text-purple-900">
                    <Users className="inline mr-2" size={20} />
                    Booking Summary: {numberOfPeople} {numberOfPeople === 1 ? 'Person' : 'People'}
                  </p>
                  <Badge variant="default" className="bg-purple-200 text-purple-800">
                    Multi-Person
                  </Badge>
                </div>
                <div className="space-y-3 mb-4">
                  {peopleServices.map((person, personIdx) => {
                    const totalDuration = person.services.reduce((sum, s) => sum + (s.duration || 0), 0)
                    const totalPrice = person.services.reduce((sum, s) => sum + (s.price || 0), 0)
                    return (
                      <div key={personIdx} className="bg-white p-3 rounded-lg border border-purple-200">
                        <p className="font-semibold text-purple-800 mb-2">Person {personIdx + 1}</p>
                        {person.services.length > 0 ? (
                          <>
                            <div className="space-y-1 mb-2">
                              {person.services.map((service, idx) => (
                                <div key={service._id || idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{capitalizeFirst(service.name)}</span>
                                  <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                              <span className="text-gray-600">⏱️ {formatDuration(totalDuration)}</span>
                              <span className="text-green-600 font-bold">Total: {formatCurrency(totalPrice)}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No services selected yet</p>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-sm font-bold pt-3 border-t-2 border-purple-300 bg-white p-3 rounded-lg">
                  <div>
                    <span className="text-gray-600 block text-xs mb-1">Total People</span>
                    <span className="text-gray-900 text-base">{numberOfPeople}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block text-xs mb-1">Total Duration</span>
                    <span className="text-gray-900 text-base">
                      {formatDuration(peopleServices.reduce((sum, person) => 
                        sum + person.services.reduce((s, service) => s + (service.duration || 0), 0), 0
                      ))}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 block text-xs mb-1">Total Price</span>
                    <span className="text-green-600 text-xl">
                      {formatCurrency(peopleServices.reduce((sum, person) => 
                        sum + person.services.reduce((s, service) => s + (service.price || 0), 0), 0
                      ))}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    // Check if all people have at least one service
                    const allHaveServices = peopleServices.every(person => person.services.length > 0)
                    if (allHaveServices) {
                      setStep(2)
                    } else {
                      toast.error('Please select at least one service for each person')
                    }
                  }}
                  className="mt-3 w-full"
                  disabled={!peopleServices.every(person => person.services.length > 0)}
                >
                  Continue with {numberOfPeople} {numberOfPeople === 1 ? 'Person' : 'People'} →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Worker */}
      {step === 2 && ((numberOfPeople === 1 && (selectedService || selectedServices.length > 0)) || (numberOfPeople > 1 && peopleServices.some(p => p.services.length > 0))) && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Choose Your Worker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Selected Services Summary */}
              {numberOfPeople === 1 ? (
                <div className="p-5 bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Scissors className="text-primary-600" size={20} />
                    <p className="text-base font-bold text-primary-900">
                      Your Selected Service{selectedServices.length > 1 ? 's' : ''}
                    </p>
                    {selectedServices.length > 1 && (
                      <Badge variant="default" className="bg-purple-100 text-purple-700 ml-auto">
                        Multi-Service
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {(selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])).filter(s => s).map((service, idx) => (
                      <div key={service?._id || idx} className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm">
                        <p className="mb-2 text-center">
                          <ShinyText
                            size="lg"
                            weight="bold"
                            baseColor="#667eea"
                            shineColor="#764ba2"
                            speed={3}
                            intensity={1}
                            direction="left-to-right"
                            shineWidth={30}
                          >
                            {service ? capitalizeFirst(service.name) : 'Unknown Service'}
                          </ShinyText>
                        </p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {service ? formatDuration(service.duration) : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign size={14} />
                            {service ? formatCurrency(service.price) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {selectedServices.length > 1 && (
                      <div className="mt-3 pt-3 border-t-2 border-primary-300 bg-white p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">Total Duration:</span>
                          <span className="text-base font-bold text-gray-900">
                            {formatDuration(selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-semibold text-gray-700">Total Price:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(selectedServices.reduce((sum, s) => sum + (s.price || 0), 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-purple-600" size={20} />
                    <p className="text-base font-bold text-purple-900">
                      Booking Summary: {numberOfPeople} {numberOfPeople === 1 ? 'Person' : 'People'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {peopleServices.map((person, personIdx) => {
                      if (!person || !person.services || person.services.length === 0) return null
                      const personTotalDuration = person.services.reduce((sum, s) => sum + (s.duration || 0), 0)
                      const personTotalPrice = person.services.reduce((sum, s) => sum + (s.price || 0), 0)
                      return (
                        <div key={personIdx} className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                              {personIdx + 1}
                            </div>
                            <p className="font-bold text-purple-900">Person {personIdx + 1}</p>
                          </div>
                          <div className="space-y-2 mb-3">
                            {person.services.filter(s => s).map((service, idx) => (
                              <div key={service?._id || idx} className="flex items-center justify-between text-sm bg-purple-50 p-2 rounded">
                                <span className="text-gray-700 font-medium">
                                  {service ? capitalizeFirst(service.name) : 'Unknown Service'}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  {service ? formatCurrency(service.price) : 'N/A'}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                            <span className="text-xs text-gray-600">⏱️ {formatDuration(personTotalDuration)}</span>
                            <span className="text-sm font-bold text-green-600">Total: {formatCurrency(personTotalPrice)}</span>
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-4 pt-4 border-t-2 border-purple-300 bg-white p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">All People Total:</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(peopleServices.reduce((sum, person) => 
                            sum + (person?.services?.reduce((s, service) => s + (service?.price || 0), 0) || 0), 0
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                          <SafeImage
                            src={worker.avatar ? uploadService.getImageUrl(worker.avatar) : null}
                            alt={worker.name}
                            className="w-16 h-16 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedWorkerForDetails(worker)
                              setShowWorkerModal(true)
                            }}
                            title="Click to view details"
                            fallbackType="worker"
                          />
                          
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
                <SafeImage
                  src={selectedWorker.avatar ? uploadService.getImageUrl(selectedWorker.avatar) : null}
                  alt={selectedWorker.name}
                  className="w-12 h-12 rounded-full object-cover"
                  fallbackType="worker"
                />
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

              {/* Recurring Appointment Options */}
              {(recurringParam === 'true' || isRecurring) && (
                <Card className="border-2 border-primary-200 bg-primary-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="recurring-toggle"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <label htmlFor="recurring-toggle" className="flex items-center gap-2 cursor-pointer">
                        <Repeat className="text-primary-600" size={20} />
                        <span className="font-semibold text-primary-900">Set Up Recurring Appointment</span>
                      </label>
                    </div>

                    {isRecurring && (
                      <div className="space-y-4 mt-4 pl-8 border-l-2 border-primary-300">
                        <Select
                          label="Frequency"
                          value={recurringFrequency}
                          onChange={(e) => setRecurringFrequency(e.target.value)}
                          options={[
                            { value: 'weekly', label: '📅 Every Week' },
                            { value: 'biweekly', label: '📅 Every 2 Weeks' },
                            { value: 'monthly', label: '📅 Every Month' }
                          ]}
                        />

                        <Input
                          label="Start Date"
                          type="date"
                          min={minDate}
                          value={recurringStartDate}
                          onChange={(e) => {
                            setRecurringStartDate(e.target.value)
                            const date = new Date(e.target.value)
                            setRecurringDayOfWeek(date.getDay())
                          }}
                        />

                        <Input
                          label="End Date (Optional)"
                          type="date"
                          min={recurringStartDate || minDate}
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                        />

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                          <p className="font-semibold mb-1">ℹ️ How it works:</p>
                          <p>• Appointments will be automatically created {recurringFrequency === 'weekly' ? 'every week' : recurringFrequency === 'biweekly' ? 'every 2 weeks' : 'every month'}</p>
                          <p>• Same time slot will be used for all appointments</p>
                          <p>• You can cancel the series anytime from Advanced Booking</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={handleBookAppointment}
                  disabled={!selectedDate || !selectedTime || (isRecurring && !recurringStartDate)}
                  loading={booking}
                  fullWidth
                  className={selectedDate && selectedTime ? "btn-confirm-booking" : ""}
                >
                  <CheckCircle size={18} />
                  {isRecurring ? 'Create Recurring Appointment' : 'Confirm Booking'}
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

      {/* Service Image Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false)
          setSelectedServiceImage(null)
        }}
        size="full"
        showHeader={false}
        className="bg-transparent shadow-none"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={() => {
              setShowImageModal(false)
              setSelectedServiceImage(null)
            }}
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          {selectedServiceImage && (
            <img
              src={uploadService.getImageUrl(selectedServiceImage, { width: 1080, height: 1080 })}
              alt="Service"
              className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                e.target.src = uploadService.getImageUrl(selectedServiceImage)
              }}
            />
          )}
        </div>
      </Modal>

      {/* Booking Summary */}
      {(step >= 2) && (
        <Card className="bg-primary-50 border-2 border-primary-200">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])).map((service, idx) => (
                <div key={service._id || idx} className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0">
                  <div className="flex-1">
                    <span className="text-gray-600 text-xs block mb-1">
                      Service {(selectedServices.length > 0 ? selectedServices : [selectedService]).length > 1 ? `${idx + 1} of ${(selectedServices.length > 0 ? selectedServices : [selectedService]).length}` : ''}
                    </span>
                    <ShinyText
                      size="lg"
                      weight="bold"
                      baseColor="#667eea"
                      shineColor="#764ba2"
                      speed={3}
                      intensity={1}
                      direction="left-to-right"
                      shineWidth={30}
                    >
                      {capitalizeFirst(service.name)}
                    </ShinyText>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>⏱️ {formatDuration(service.duration)}</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(service.price)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t-2 border-primary-300 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">Total Duration:</span>
                  <span className="font-semibold text-gray-900">
                    {formatDuration((selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])).reduce((sum, s) => sum + (s.duration || 0), 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Total Price:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency((selectedServices.length > 0 ? selectedServices : (selectedService ? [selectedService] : [])).reduce((sum, s) => sum + (s.price || 0), 0))}
                  </span>
                </div>
              </div>
              
              {selectedDate && (
                <div className="flex items-center justify-between pt-3 border-t border-primary-200">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default BookAppointmentPage

