import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { salonService } from '../../services/salonService'
import { salonClientService } from '../../services/salonClientService'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import { MapPin, Phone, Mail, Clock, Check, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const ScanQRPage = () => {
  const { qrCode } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const data = await salonService.getSalonByQRCode(qrCode)
        setSalon(data)
        
        // Check if client is already joined to this salon
        if (user && user.role === 'Client' && data._id) {
          try {
            const mySalons = await salonClientService.getMySalons()
            const isClientOfSalon = mySalons.some(s => 
              (s.salonId?._id || s.salonId) === data._id || 
              (s.salonId?.id || s.salonId) === data._id
            )
            setIsJoined(isClientOfSalon)
          } catch (error) {
            console.error('Error checking salon membership:', error)
          }
        }
      } catch (error) {
        toast.error('Salon not found')
      } finally {
        setLoading(false)
      }
    }

    if (qrCode) {
      fetchSalon()
    }
  }, [qrCode, user])

  const handleJoinSalon = async () => {
    if (!user) {
      toast.error('Please login to join a salon')
      navigate('/login')
      return
    }

    if (user.role !== 'Client') {
      toast.error('Only clients can join salons')
      return
    }

    setJoining(true)
    try {
      const result = await salonClientService.joinSalonViaQR(qrCode)
      
      if (result.alreadyJoined) {
        toast.success('You are already a client of this salon!')
        setIsJoined(true)
      } else {
        toast.success(result.message || 'Successfully joined salon!')
        setIsJoined(true)
      }
    } catch (error) {
      console.error('Error joining salon:', error)
      toast.error(error.response?.data?.message || 'Failed to join salon')
    } finally {
      setJoining(false)
    }
  }

  const handleBook = () => {
    if (!user) {
      toast.error('Please login to book an appointment')
      navigate('/login')
      return
    }

    if (user.role !== 'Client') {
      toast.error('Only clients can book appointments')
      return
    }

    // If not joined, suggest joining first
    if (!isJoined) {
      toast.error('Please join this salon first to book appointments')
      return
    }

    navigate(`/client/book/${salon._id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Salon Not Found</h2>
          <p className="text-gray-600 mb-6">The QR code you scanned is invalid or expired.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Salon Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{salon.name}</h1>
            {salon.description && (
              <p className="text-primary-100">{salon.description}</p>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Contact Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {salon.address?.street && (
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary-600 mt-1" size={20} />
                  <div>
                    <div className="font-medium">Address</div>
                    <div className="text-gray-600">
                      {salon.address.street}<br />
                      {salon.address.city}, {salon.address.state} {salon.address.zipCode}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="text-primary-600 mt-1" size={20} />
                <div>
                  <div className="font-medium">Phone</div>
                  <a href={`tel:${salon.phone}`} className="text-primary-600 hover:text-primary-700">
                    {salon.phone}
                  </a>
                </div>
              </div>

              {salon.email && (
                <div className="flex items-start gap-3">
                  <Mail className="text-primary-600 mt-1" size={20} />
                  <div>
                    <div className="font-medium">Email</div>
                    <a href={`mailto:${salon.email}`} className="text-primary-600 hover:text-primary-700">
                      {salon.email}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="text-primary-600 mt-1" size={20} />
                <div>
                  <div className="font-medium">Working Hours</div>
                  <div className="text-gray-600">
                    {Object.entries(salon.workingHours || {}).some(([_, hours]) => !hours.isClosed) ? (
                      <span>Check schedule for details</span>
                    ) : (
                      <span>No hours available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Working Hours Details */}
            {salon.workingHours && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Schedule</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(salon.workingHours).map(([day, hours]) => (
                    <div key={day} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium capitalize text-sm">{day}</div>
                      <div className="text-sm text-gray-600">
                        {hours.isClosed ? (
                          <span className="text-red-600">Closed</span>
                        ) : (
                          <span>{hours.open} - {hours.close}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user && user.role === 'Client' ? (
                <>
                  {!isJoined ? (
                    <Button 
                      size="lg" 
                      fullWidth 
                      onClick={handleJoinSalon}
                      loading={joining}
                    >
                      <UserPlus size={20} className="mr-2" />
                      Join This Salon
                    </Button>
                  ) : (
                    <Button size="lg" fullWidth onClick={handleBook}>
                      <Check size={20} className="mr-2" />
                      Book an Appointment
                    </Button>
                  )}
                  {isJoined && (
                    <Button variant="outline" size="lg" fullWidth onClick={() => navigate(`/salon/${salon._id}`)}>
                      View Salon Details
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button size="lg" fullWidth onClick={handleBook}>
                    Book an Appointment
                  </Button>
                  <Button variant="outline" size="lg" fullWidth onClick={() => navigate('/')}>
                    Browse Services
                  </Button>
                </>
              )}
            </div>
            
            {/* Join Status Message */}
            {user && user.role === 'Client' && isJoined && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <Check className="text-green-600" size={18} />
                <span className="text-sm text-green-700 font-medium">
                  You are a client of this salon
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScanQRPage

