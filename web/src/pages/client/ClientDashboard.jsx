import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { salonClientService } from '../../services/salonClientService'
import { uploadService } from '../../services/uploadService'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Calendar, Store, MapPin, Phone, Plus, Crown, Sparkles, Star, Share2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'

const ClientDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mySalons, setMySalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasVIPStatus, setHasVIPStatus] = useState(false)
  const [selectedSalonForQR, setSelectedSalonForQR] = useState(null)

  useEffect(() => {
    loadMySalons()
  }, [])

  const loadMySalons = async () => {
    try {
      const data = await salonClientService.getMySalons()
      setMySalons(data)
      
      // Check if client has VIP status in any salon
      const isVIP = data.some(item => item.status === 'vip')
      setHasVIPStatus(isVIP)
    } catch (error) {
      console.error('Error loading salons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSalon = (salonId) => {
    navigate(`/salon/${salonId}`)
  }

  const handleShareQR = (salon) => {
    setSelectedSalonForQR(salon)
  }

  const handleCloseQRModal = () => {
    setSelectedSalonForQR(null)
  }

  const handleCopyQRCode = async (qrCode) => {
    try {
      await navigator.clipboard.writeText(qrCode)
      toast.success('QR code copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy QR code')
    }
  }

  const handleCopyQRUrl = async (qrCode) => {
    const baseUrl = window.location.origin
    const qrUrl = `${baseUrl}/scan/${qrCode}`
    try {
      await navigator.clipboard.writeText(qrUrl)
      toast.success('QR link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShareQRUrl = async (salon) => {
    const baseUrl = window.location.origin
    const qrUrl = `${baseUrl}/scan/${salon.salonId.qrCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${salon.salonId.name}`,
          text: `Scan this QR code or click the link to join ${salon.salonId.name} and book appointments!`,
          url: qrUrl,
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          handleCopyQRUrl(salon.salonId.qrCode)
        }
      }
    } else {
      handleCopyQRUrl(salon.salonId.qrCode)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {user?.name}</p>
      </div>

      {/* VIP Status Card */}
      {hasVIPStatus && (
        <Card className="bg-gradient-to-r from-amber-400 to-yellow-500 border-2 border-yellow-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Crown className="text-yellow-600" size={24} />
                </div>
                <div className="text-white">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    VIP MEMBER 💎
                  </h3>
                  <p className="text-yellow-50 text-sm">
                    Priority booking access
                  </p>
                </div>
              </div>
              <Star className="text-yellow-200" size={32} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Barbershops Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Barbershops</h2>
          <Link to="/join-salon">
            <Button variant="outline" size="sm">
              <Plus size={18} />
              Join New Salon
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : mySalons.length === 0 ? (
          <Card className="p-12 text-center">
            <Store className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salons Yet</h3>
            <p className="text-gray-600 mb-4">
              Join a salon to start booking appointments
            </p>
            <Link to="/join-salon">
              <Button>
                <Plus size={18} />
                Join via QR Code
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mySalons.map((item) => (
              <Card 
                key={item._id} 
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  item.status === 'vip' ? 'border-4 border-yellow-400 shadow-xl' : ''
                }`}
              >
                <CardContent className="p-0">
                  {/* VIP Badge Overlay */}
                  {item.status === 'vip' && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Crown className="text-white" size={16} />
                        <span className="text-white font-bold text-sm">VIP</span>
                        <Sparkles className="text-white" size={16} />
                      </div>
                    </div>
                  )}
                  
                  {/* Salon Image */}
                  {item.salonId.logo ? (
                    <div className="h-40 w-full overflow-hidden rounded-t-lg">
                      <img
                        src={uploadService.getImageUrl(item.salonId.logo)}
                        alt={item.salonId.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-primary-100 to-purple-100 rounded-t-lg flex items-center justify-center">
                      <Store className="text-primary-300" size={48} />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {item.salonId.name}
                        </h3>
                        {item.status === 'vip' && (
                          <Badge variant="warning">⭐ VIP Member</Badge>
                        )}
                      </div>
                    </div>

                    {item.salonId.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.salonId.description}
                      </p>
                    )}

                    {/* Location */}
                    {item.salonId.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span>{item.salonId.address.city}</span>
                      </div>
                    )}

                    {/* Phone */}
                    {item.salonId.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Phone size={14} />
                        <span>{item.salonId.phone}</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-gray-600">
                        {item.totalAppointments || 0} appointments
                      </span>
                      <span className="text-gray-600">
                        Member since {new Date(item.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/book?salon=${item.salonId._id}`)}
                        className="flex-1"
                      >
                        <Calendar size={16} />
                        Book Appointment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleViewSalon(item.salonId._id)}
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      {item.salonId.qrCode && (
                        <Button
                          variant="outline"
                          onClick={() => handleShareQR(item)}
                          className="shrink-0"
                          title="Share QR Code"
                        >
                          <Share2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Link to="/appointments">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200">
            <Calendar className="mx-auto text-blue-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold mb-2">My Appointments</h3>
            <p className="text-gray-600 text-sm">
              View and manage your upcoming appointments
            </p>
          </Card>
        </Link>

        <Link to="/search-salons">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200">
            <Store className="mx-auto text-purple-600 mb-3" size={48} />
            <h3 className="text-lg font-semibold mb-2">Find More Salons</h3>
            <p className="text-gray-600 text-sm">
              Discover and explore new salons near you
            </p>
          </Card>
        </Link>
      </div>

      {/* QR Code Share Modal */}
      {selectedSalonForQR && selectedSalonForQR.salonId.qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Share QR Code</h3>
                  <p className="text-sm text-gray-600">{selectedSalonForQR.salonId.name}</p>
                </div>
                <button
                  onClick={handleCloseQRModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed border-gray-300 mb-4">
                <QRCodeSVG 
                  value={`${window.location.origin}/scan/${selectedSalonForQR.salonId.qrCode}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* QR Code Value */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedSalonForQR.salonId.qrCode}
                    readOnly
                    className="input flex-1 bg-white font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyQRCode(selectedSalonForQR.salonId.qrCode)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* QR Code URL */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/scan/${selectedSalonForQR.salonId.qrCode}`}
                    readOnly
                    className="input flex-1 bg-white text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyQRUrl(selectedSalonForQR.salonId.qrCode)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={() => handleShareQRUrl(selectedSalonForQR)}
                fullWidth
                className="mb-4"
              >
                <Share2 size={18} />
                Share QR Code
              </Button>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  How to share:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Click "Share QR Code" to share via your device</li>
                  <li>Or copy the QR code or link and send it manually</li>
                  <li>Others can scan the QR code to join this salon</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDashboard

