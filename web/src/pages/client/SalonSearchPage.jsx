import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { uploadService } from '../../services/uploadService'
import Card, { CardContent } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SafeImage from '../../components/ui/SafeImage'
import { Search, MapPin, Scissors, Users, Phone, Mail, Store, Star, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const SalonSearchPage = () => {
  const navigate = useNavigate()
  const [salons, setSalons] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  
  const [filters, setFilters] = useState({
    query: '',
    city: '',
    sortBy: 'name'
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [salonsData, citiesData] = await Promise.all([
        salonSearchService.searchSalons(),
        salonSearchService.getCities()
      ])
      
      setSalons(salonsData)
      setCities(citiesData)
    } catch (error) {
      console.error('Error loading salons:', error)
      toast.error('Failed to load salons')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setSearching(true)
    try {
      const results = await salonSearchService.searchSalons(filters)
      setSalons(results)
      
      if (results.length === 0) {
        toast.info('No salons found matching your criteria')
      }
    } catch (error) {
      console.error('Error searching salons:', error)
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleViewSalon = (salonId) => {
    navigate(`/salon/${salonId}`)
  }

  const handleBookNow = (salonId) => {
    navigate(`/salon/${salonId}?book=true`)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Perfect Salon</h1>
        <p className="text-gray-600">Discover and book appointments at the best salons near you</p>
      </div>

      {/* Search Bar */}
      <Card className="bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by salon name..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyPress={handleKeyPress}
                icon={<Search size={20} className="text-gray-400" />}
              />
            </div>
            
            <Select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              options={[
                { value: '', label: 'All Cities' },
                ...cities.map(city => ({ value: city, label: city }))
              ]}
            />

            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              options={[
                { value: 'name', label: 'Name (A-Z)' },
                { value: 'newest', label: 'Newest First' }
              ]}
            />
          </div>

          <div className="mt-4 flex gap-3">
            <Button onClick={handleSearch} loading={searching} fullWidth>
              <Search size={18} />
              Search Salons
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ query: '', city: '', sortBy: 'name' })
                loadInitialData()
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found <span className="font-semibold text-gray-900">{salons.length}</span> salon{salons.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Salons Grid */}
      {salons.length === 0 ? (
        <Card className="p-12 text-center">
          <Store className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salons Found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search filters or check back later
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salons.map((salon) => (
            <Card key={salon._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                {/* Salon Logo/Image */}
                <div className="h-48 w-full overflow-hidden rounded-t-lg">
                  <SafeImage
                    src={salon.logo ? uploadService.getImageUrl(salon.logo) : null}
                    alt={salon.name}
                    className="w-full h-full"
                    fallbackType="salon"
                  />
                </div>

                <div className="p-6">
                  {/* Salon Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {salon.name}
                  </h3>

                  {/* Description */}
                  {salon.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {salon.description}
                    </p>
                  )}

                  {/* Location */}
                  {salon.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        {salon.address.street && `${salon.address.street}, `}
                        {salon.address.city}
                        {salon.address.state && `, ${salon.address.state}`}
                      </span>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="space-y-2 mb-4">
                    {salon.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={16} />
                        <span>{salon.phone}</span>
                      </div>
                    )}
                    {salon.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={16} />
                        <span>{salon.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Scissors size={16} className="text-primary-600" />
                      <span className="font-medium">{salon.serviceCount || 0}</span>
                      <span>Services</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSalon(salon._id)}
                      fullWidth
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBookNow(salon._id)}
                      fullWidth
                    >
                      <Calendar size={16} />
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SalonSearchPage

