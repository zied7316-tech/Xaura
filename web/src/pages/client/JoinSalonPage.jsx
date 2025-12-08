import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonClientService } from '../../services/salonClientService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import QRScanner from '../../components/qr/QRScanner'
import { 
  QrCode, Store, Check, Camera, Keyboard, Sparkles, 
  Clock, Calendar, Star, CheckCircle2, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const JoinSalonPage = () => {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [salonInfo, setSalonInfo] = useState(null)
  const [joined, setJoined] = useState(false)
  const [entryMethod, setEntryMethod] = useState('manual') // 'manual' or 'camera'
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

  useEffect(() => {
    // Reset on mount
    setSalonInfo(null)
    setJoined(false)
    setShowSuccessAnimation(false)
  }, [])

  const handleCheckQR = async () => {
    if (!qrCode.trim()) {
      toast.error('Please enter a QR code')
      return
    }

    setLoading(true)
    try {
      const data = await salonClientService.getSalonInfoByQR(qrCode)
      setSalonInfo(data.salon)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Invalid QR code. Salon not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSalon = async () => {
    setLoading(true)
    try {
      const result = await salonClientService.joinSalonViaQR(qrCode)
      
      if (result.alreadyJoined) {
        toast.success('You are already a client of this salon!')
        setJoined(true)
      } else {
        toast.success(result.message)
        setJoined(true)
        setShowSuccessAnimation(true)
      }
      
      // Redirect to salon details after 3 seconds
      // Use slug if available (better URL), otherwise use ID (ensure it's a string)
      const salon = result.data?.salon
      if (salon) {
        console.log('Salon data from join response:', salon)
        setTimeout(() => {
          // Prefer slug for better URLs, fallback to ID
          if (salon.slug) {
            console.log('Redirecting to salon via slug:', salon.slug)
            navigate(`/SALON/${salon.slug}`)
          } else {
            // Ensure ID is converted to string
            const salonId = String(salon.id || salon._id)
            console.log('Redirecting to salon via ID:', salonId)
            navigate(`/salon/${salonId}`)
          }
        }, 3000)
      } else {
        console.error('Salon data not found in response:', result)
        toast.error('Salon information not found. Redirecting to salon search...')
        setTimeout(() => {
          navigate('/search-salons')
        }, 2000)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Failed to join salon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Hero Header with Animation */}
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform">
            <QrCode className="text-white" size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Join Your Favorite Salon
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scan or enter the salon's QR code to join their client list and start booking appointments instantly
          </p>
        </div>

        {/* Entry Method Selection - Enhanced */}
        {!salonInfo && !joined && (
          <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
            <button
              onClick={() => setEntryMethod('manual')}
              className={`relative p-8 border-2 rounded-2xl transition-all transform hover:scale-105 ${
                entryMethod === 'manual'
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  entryMethod === 'manual' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-400'
                } transition-colors`}>
                  <Keyboard size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Entry</h3>
                <p className="text-gray-600 text-sm">Type the QR code</p>
                {entryMethod === 'manual' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="text-primary-500" size={24} />
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => setEntryMethod('camera')}
              className={`relative p-8 border-2 rounded-2xl transition-all transform hover:scale-105 ${
                entryMethod === 'camera'
                  ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-primary-300 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  entryMethod === 'camera' 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 text-gray-400'
                } transition-colors`}>
                  <Camera size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h3>
                <p className="text-gray-600 text-sm">Use your camera</p>
                {entryMethod === 'camera' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="text-primary-500" size={24} />
                  </div>
                )}
              </div>
            </button>
          </div>
        )}

        {/* QR Code Input/Camera */}
        {!salonInfo && !joined && (
          <Card className="animate-fade-in shadow-xl border-2 border-primary-100">
            <CardHeader className="bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode size={24} />
                {entryMethod === 'camera' ? 'Scan QR Code' : 'Enter QR Code'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {entryMethod === 'camera' ? (
                <QRScanner 
                  onScan={(code) => {
                    setQrCode(code)
                    handleCheckQR()
                  }} 
                />
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Salon QR Code"
                    placeholder="Enter the code from salon's QR..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCheckQR()
                      }
                    }}
                    className="text-lg"
                  />
                  <Button onClick={handleCheckQR} loading={loading} fullWidth size="lg">
                    <Sparkles size={18} className="mr-2" />
                    Check QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Salon Preview - Enhanced with Animation */}
        {salonInfo && !joined && (
          <Card className="border-2 border-primary-300 shadow-2xl animate-scale-in overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Store size={28} />
                Salon Found!
              </h2>
              <p className="text-primary-100">Review the salon information below</p>
            </div>
            
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                {salonInfo.logo ? (
                  <img
                    src={uploadService.getImageUrl(salonInfo.logo)}
                    alt={salonInfo.name}
                    className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center shadow-lg border-4 border-white">
                    <Store className="text-primary-400" size={48} />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {salonInfo.name}
                  </h3>
                  {salonInfo.description && (
                    <p className="text-gray-600 mb-4 text-lg">{salonInfo.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    {salonInfo.address && (
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="text-primary-600">📍</span>
                        {salonInfo.address.street}, {salonInfo.address.city}
                      </p>
                    )}
                    {salonInfo.phone && (
                      <p className="text-gray-700 flex items-center gap-2">
                        <span className="text-primary-600">📞</span>
                        {salonInfo.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-6 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="text-primary-600" size={20} />
                  What you can do after joining:
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="text-green-600 flex-shrink-0 mt-1" size={18} />
                    <span className="text-sm text-gray-700">Book appointments instantly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="text-blue-600 flex-shrink-0 mt-1" size={18} />
                    <span className="text-sm text-gray-700">Manage your bookings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="text-yellow-600 flex-shrink-0 mt-1" size={18} />
                    <span className="text-sm text-gray-700">Track your visit history</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleJoinSalon} loading={loading} fullWidth size="lg" className="text-lg">
                  <Check size={20} className="mr-2" />
                  Join This Salon
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSalonInfo(null)
                    setQrCode('')
                  }}
                  fullWidth
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success State - Enhanced with Celebration */}
        {joined && salonInfo && (
          <div className="animate-scale-in">
            <Card className="border-4 border-green-500 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center relative overflow-hidden">
                {/* Celebration Animation */}
                {showSuccessAnimation && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-float"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '2s'
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl transform animate-bounce">
                    <Check className="text-green-600" size={48} />
                  </div>
                  <h3 className="text-4xl font-bold mb-4">
                    Successfully Joined! 🎉
                  </h3>
                  <p className="text-xl text-green-50 mb-2">
                    You are now a client of
                  </p>
                  <p className="text-2xl font-bold mb-6">
                    {salonInfo.name}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-50">
                    <Zap size={20} />
                    <span>Redirecting to salon page...</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Instructions - Enhanced */}
        {!salonInfo && !joined && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 animate-fade-in">
            <CardContent className="p-6">
              <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                <QrCode className="text-blue-600" size={24} />
                How to join a salon:
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <p className="text-blue-900 pt-1">Get the QR code from the salon (displayed at salon or shared by owner)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <p className="text-blue-900 pt-1">Enter or scan the code above</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <p className="text-blue-900 pt-1">Review the salon information</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      4
                    </div>
                    <p className="text-blue-900 pt-1">Click "Join This Salon"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      5
                    </div>
                    <p className="text-blue-900 pt-1">Start booking appointments instantly!</p>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <Zap className="text-yellow-500" size={16} />
                      <strong>Quick Tip:</strong> You can bookmark the salon page for easy access later!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.7;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default JoinSalonPage
