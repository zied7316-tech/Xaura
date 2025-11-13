import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { 
  MapPin, Phone, Mail, Clock, Calendar, ArrowLeft, 
  Scissors, DollarSign, Users, User, Store 
} from 'lucide-react'
import { formatCurrency, formatDuration } from '../../utils/helpers'
import toast from 'react-hot-toast'

const SalonDetailsPage = () => {
  const { salonId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldShowBooking = searchParams.get('book') === 'true'

  const [salonData, setSalonData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSalonDetails()
  }, [salonId])

  const loadSalonDetails = async () => {
    try {
      const data = await salonSearchService.getSalonDetails(salonId)
      setSalonData(data)
    } catch (error) {
      console.error('Error loading salon details:', error)
      toast.error('Failed to load salon details')
      navigate('/search-salons')
    } finally {
      setLoading(false)
    }
  }

  const handleBookService = (serviceId) => {
    // Navigate to booking page with salon and service pre-selected
    navigate(`/book?salon=${salonId}&service=${serviceId}`)
  }

  const handleBookNow = () => {
    // Navigate to booking page with just salon
    navigate(`/book?salon=${salonId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!salonData) {
    return (
      <div className="text-center py-12">
        <Store className="mx-auto text-gray-400 mb-4" size={64} />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Salon Not Found</h3>
        <Button onClick={() => navigate('/search-salons')}>
          Back to Search
        </Button>
      </div>
    )
  }

  const { salon, services, workers } = salonData

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/search-salons')}>
        <ArrowLeft size={18} />
        Back to Search
      </Button>

      {/* Salon Header */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo */}
            <div className="lg:col-span-1">
              {salon.logo ? (
                <img
                  src={uploadService.getImageUrl(salon.logo)}
                  alt={salon.name}
                  className="w-full h-64 lg:h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-t-none"
                />
              ) : (
                <div className="w-full h-64 lg:h-full bg-gradient-to-br from-primary-100 to-purple-100 rounded-t-lg lg:rounded-l-lg lg:rounded-t-none flex items-center justify-center">
                  <Store className="text-primary-300" size={80} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="lg:col-span-2 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{salon.name}</h1>
              
              {salon.description && (
                <p className="text-gray-600 mb-6">{salon.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Location */}
                {salon.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">
                        {salon.address.street && `${salon.address.street}, `}
                        {salon.address.city}
                        {salon.address.state && `, ${salon.address.state}`}
                        {salon.address.zipCode && ` ${salon.address.zipCode}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {salon.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a href={`tel:${salon.phone}`} className="text-sm text-primary-600 hover:underline">
                        {salon.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {salon.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="text-primary-600 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href={`mailto:${salon.email}`} className="text-sm text-primary-600 hover:underline">
                        {salon.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
                  <Scissors className="text-primary-600" size={20} />
                  <span className="font-semibold text-gray-900">{services.length}</span>
                  <span className="text-gray-600">Services</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                  <Users className="text-blue-600" size={20} />
                  <span className="font-semibold text-gray-900">{workers.length}</span>
                  <span className="text-gray-600">Staff</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No services available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service._id} className="border border-gray-200">
                  <CardContent className="p-4">
                    {/* Service Image */}
                    {service.image ? (
                      <div className="h-32 w-full overflow-hidden rounded-lg mb-3">
                        <img
                          src={uploadService.getImageUrl(service.image)}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-gradient-to-br from-primary-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                        <Scissors className="text-primary-300" size={32} />
                      </div>
                    )}

                    <div className="mb-2">
                      <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                      <Badge variant="default" size="sm">{service.category}</Badge>
                    </div>

                    {service.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={16} />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign size={16} />
                        <span>{formatCurrency(service.price)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleBookService(service._id)}
                      fullWidth
                    >
                      <Calendar size={16} />
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff */}
      {workers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Our Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {workers.map((worker) => (
                <div key={worker._id} className="text-center">
                  {worker.avatar ? (
                    <img
                      src={uploadService.getImageUrl(worker.avatar)}
                      alt={worker.name}
                      className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto mb-2 bg-primary-100 flex items-center justify-center">
                      <User className="text-primary-600" size={32} />
                    </div>
                  )}
                  <p className="font-medium text-gray-900 text-sm">{worker.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default SalonDetailsPage

