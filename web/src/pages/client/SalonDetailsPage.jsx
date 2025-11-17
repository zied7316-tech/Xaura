import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { salonSearchService } from '../../services/salonSearchService'
import { uploadService } from '../../services/uploadService'
import { reviewService } from '../../services/reviewService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SafeImage from '../../components/ui/SafeImage'
import Modal from '../../components/ui/Modal'
import ThreeDImageRing from '../../components/ui/ThreeDImageRing'
import WorkerDetailsModal from '../../components/worker/WorkerDetailsModal'
import ReviewDisplay from '../../components/reviews/ReviewDisplay'
import { 
  MapPin, Phone, Mail, Clock, Calendar, ArrowLeft, 
  Scissors, DollarSign, Users, User, Store, Star, X
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
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [workerReviews, setWorkerReviews] = useState({}) // { workerId: { reviews, stats } }
  const [loadingReviews, setLoadingReviews] = useState({})
  const [selectedServiceImage, setSelectedServiceImage] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    loadSalonDetails()
  }, [salonId])

  const loadSalonDetails = async () => {
    try {
      const data = await salonSearchService.getSalonDetails(salonId)
      setSalonData(data)
      
      // Load reviews for all workers
      if (data.workers && data.workers.length > 0) {
        loadWorkerReviews(data.workers)
      }
    } catch (error) {
      console.error('Error loading salon details:', error)
      toast.error('Failed to load salon details')
      navigate('/search-salons')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkerReviews = async (workers) => {
    const reviewsData = {}
    
    // Set all workers as loading
    const initialLoading = {}
    workers.forEach(worker => {
      initialLoading[worker._id] = true
    })
    setLoadingReviews(initialLoading)
    
    // Load reviews for all workers in parallel
    const reviewPromises = workers.map(async (worker) => {
      try {
        const data = await reviewService.getWorkerReviews(worker._id)
        return {
          workerId: worker._id,
          data: {
            reviews: data.data || [],
            stats: data.stats || null
          }
        }
      } catch (error) {
        console.error(`Error loading reviews for worker ${worker._id}:`, error)
        return {
          workerId: worker._id,
          data: {
            reviews: [],
            stats: null
          }
        }
      }
    })
    
    const results = await Promise.all(reviewPromises)
    
    // Build reviews data object
    results.forEach(({ workerId, data }) => {
      reviewsData[workerId] = data
    })
    
    setWorkerReviews(reviewsData)
    
    // Clear loading state
    setLoadingReviews({})
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

  const { salon, services = [], workers = [] } = salonData || {}

  console.log('📋 SalonDetailsPage - Services data:', {
    salonDataExists: !!salonData,
    servicesCount: services?.length,
    services: services,
    servicesWithImages: services?.filter(s => s?.image && String(s.image).trim() !== '').length,
    serviceImages: services?.map(s => ({ name: s?.name, image: s?.image, hasImage: !!(s?.image && String(s.image).trim() !== '') }))
  });

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
              <SafeImage
                src={salon?.logo ? uploadService.getImageUrl(salon.logo) : null}
                alt={salon?.name || 'Salon'}
                className="w-full h-64 lg:h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-t-none"
                fallbackType="salon"
              />
            </div>

            {/* Info */}
            <div className="lg:col-span-2 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{salon?.name || 'Salon'}</h1>
              
              {salon?.description && (
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
          {!services || services.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No services available</p>
            </div>
          ) : (
            <>
              {/* 3D Image Ring - Show when there are services with images */}
              {(() => {
                console.log('🚀 3D RING DEBUG START ===========================================');
                console.log('📋 Services array:', services);
                console.log('📋 Services length:', services?.length);
                console.log('📋 Services is array?', Array.isArray(services));
                
                if (!services || !Array.isArray(services) || services.length === 0) {
                  console.log('❌ No services array available - EXITING');
                  return null;
                }

                console.log('🔍 Checking services for 3D ring:', {
                  totalServices: services.length,
                  services: services.map(s => ({ 
                    id: s?._id, 
                    name: s?.name, 
                    hasImage: !!(s?.image), 
                    image: s?.image 
                  }))
                });
                
                const servicesWithImages = services
                  .map((service, index) => {
                    console.log(`\n🔍 Processing service ${index + 1}:`, {
                      name: service?.name,
                      hasService: !!service,
                      imageRaw: service?.image,
                      imageType: typeof service?.image,
                      imageLength: service?.image?.length,
                      imageTrimmed: service?.image ? String(service.image).trim() : null,
                      isEmpty: !service?.image || String(service.image).trim() === ''
                    });
                    return service;
                  })
                  .filter(service => {
                    if (!service) {
                      console.log('⚠️ Service is null/undefined');
                      return false;
                    }
                    // More lenient check: allow any truthy value that's not just whitespace
                    const hasImage = service.image && 
                                     String(service.image).trim() !== '' && 
                                     String(service.image).trim() !== 'null' &&
                                     String(service.image).trim() !== 'undefined';
                    console.log(`✅ Service "${service?.name}": hasImage=${hasImage}, image="${service?.image}"`);
                    return hasImage;
                  })
                  .map(service => {
                    try {
                      const url = uploadService.getImageUrl(service.image);
                      console.log(`✅ Service "${service.name}": imageUrl="${url}"`);
                      return url;
                    } catch (error) {
                      console.error(`❌ Error getting image URL for ${service.name}:`, error);
                      return null;
                    }
                  })
                  .filter(url => {
                    const isValid = url && url !== null && url !== '' && url !== 'null' && url !== 'undefined';
                    if (!isValid) {
                      console.log('⚠️ Filtered out invalid URL:', url);
                    }
                    return isValid;
                  });

                console.log('🎨 3D Ring - Final filtered images:', {
                  count: servicesWithImages.length,
                  urls: servicesWithImages
                });
                
                if (servicesWithImages.length >= 2) {
                  console.log('✅ RENDERING 3D RING with', servicesWithImages.length, 'images');
                  console.log('✅ Images array:', servicesWithImages);
                  return (
                    <div className="mb-8" style={{ border: '2px solid red', padding: '10px' }}>
                      <div className="w-full h-96 relative bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg overflow-hidden">
                        <ThreeDImageRing
                          images={servicesWithImages}
                          width={280}
                          perspective={2000}
                          imageDistance={400}
                          initialRotation={180}
                          animationDuration={1.2}
                          staggerDelay={0.08}
                          hoverOpacity={0.4}
                          draggable={true}
                          mobileBreakpoint={768}
                          mobileScaleFactor={0.7}
                          containerClassName="w-full h-full"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-20">
                          <p className="text-sm text-gray-600 text-center">
                            <span className="font-semibold text-primary-600">Drag to rotate</span> • {servicesWithImages.length} services
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  console.log('❌ NOT RENDERING 3D RING - need 2+ images, got:', servicesWithImages.length);
                  console.log('❌ Available images:', servicesWithImages);
                  return null;
                }
              })()}

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      {/* Service Image */}
                      <div 
                        className="h-32 w-full overflow-hidden rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity relative group"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('🖼️ Image container clicked!', { 
                            hasImage: !!service.image, 
                            image: service.image,
                            serviceName: service.name 
                          })
                          if (service.image) {
                            console.log('🖼️ Setting image modal state')
                            setSelectedServiceImage(service.image)
                            setShowImageModal(true)
                            console.log('🖼️ Modal should now be open')
                          } else {
                            console.log('⚠️ No image to display')
                          }
                        }}
                        title="Click to view full size"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <div 
                          className="w-full h-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('🖼️ Inner div clicked')
                          }}
                        >
                          <SafeImage
                            src={service.image ? uploadService.getImageUrl(service.image, { width: 1080, height: 1080 }) : null}
                            alt={service.name}
                            className="w-full h-full object-cover pointer-events-none"
                            fallbackType="service"
                          />
                        </div>
                        <div 
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold bg-black/50 px-2 py-1 rounded">
                            Click to enlarge
                          </div>
                        </div>
                      </div>

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
            </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => {
                const workerReviewData = workerReviews[worker._id]
                const isLoading = loadingReviews[worker._id]
                
                return (
                  <Card key={worker._id} className="border border-gray-200 hover:border-primary-300 transition-colors">
                    <CardContent className="p-4">
                      {/* Worker Info */}
                      <div 
                        className="text-center cursor-pointer group mb-4"
                        onClick={() => {
                          setSelectedWorkerForDetails(worker)
                          setShowWorkerModal(true)
                        }}
                      >
                        <SafeImage
                          src={worker.avatar ? uploadService.getImageUrl(worker.avatar) : null}
                          alt={worker.name}
                          className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-primary-200 group-hover:border-primary-400 group-hover:ring-2 group-hover:ring-primary-200 transition-all"
                          title="Click to view details"
                          fallbackType="worker"
                        />
                        <p className="font-medium text-gray-900 text-sm group-hover:text-primary-600 transition-colors">{worker.name}</p>
                        
                        {/* Rating Summary */}
                        {workerReviewData?.stats && workerReviewData.stats.totalReviews > 0 && (
                          <div className="flex items-center justify-center gap-1 mt-2">
                            <Star className="text-yellow-400 fill-yellow-400" size={14} />
                            <span className="text-sm font-semibold text-gray-900">
                              {workerReviewData.stats.averageOverall?.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({workerReviewData.stats.totalReviews})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Reviews Preview */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <Star className="text-primary-600" size={16} />
                            Reviews
                          </h4>
                          {workerReviewData?.stats && workerReviewData.stats.totalReviews > 0 && (
                            <div className="text-right">
                              <span className="text-xs text-gray-500 block">
                                {workerReviewData.stats.totalReviews} {workerReviewData.stats.totalReviews === 1 ? 'review' : 'reviews'}
                              </span>
                              {workerReviewData.stats.uniqueClientCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  from {workerReviewData.stats.uniqueClientCount} {workerReviewData.stats.uniqueClientCount === 1 ? 'client' : 'clients'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {isLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          </div>
                        ) : workerReviewData?.reviews && workerReviewData.reviews.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {workerReviewData.reviews.slice(0, 2).map((review) => (
                              <div key={review._id} className="text-xs">
                                <div className="flex items-center gap-1 mb-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={10}
                                      className={star <= review.overallRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                    />
                                  ))}
                                </div>
                                {review.comment && (
                                  <p className="text-gray-600 line-clamp-2">{review.comment}</p>
                                )}
                                <p className="text-gray-400 mt-1">- {review.clientId?.name || 'Anonymous'}</p>
                              </div>
                            ))}
                            {workerReviewData.reviews.length > 2 && (
                              <p className="text-xs text-primary-600 text-center pt-2">
                                +{workerReviewData.reviews.length - 2} more reviews
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2">No reviews yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
      {console.log('🔍 Modal render check:', { showImageModal, selectedServiceImage })}
      <Modal
        isOpen={showImageModal}
        onClose={() => {
          console.log('🔍 Closing modal')
          setShowImageModal(false)
          setSelectedServiceImage(null)
        }}
        size="full"
        showHeader={false}
        className="bg-transparent shadow-none"
      >
        <div className="relative w-full h-full flex items-center justify-center min-h-[400px]">
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('🔍 Close button clicked')
              setShowImageModal(false)
              setSelectedServiceImage(null)
            }}
            className="absolute top-4 right-4 z-[10002] bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          {selectedServiceImage ? (
            <img
              src={uploadService.getImageUrl(selectedServiceImage, { width: 1080, height: 1080 })}
              alt="Service"
              className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('❌ Image load error')
                e.target.src = uploadService.getImageUrl(selectedServiceImage)
              }}
              onLoad={() => console.log('✅ Image loaded successfully')}
            />
          ) : (
            <div className="text-white">Loading image...</div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default SalonDetailsPage

