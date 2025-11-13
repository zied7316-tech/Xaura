import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonClientService } from '../../services/salonClientService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import QRScanner from '../../components/qr/QRScanner'
import { QrCode, Store, Check, Camera, Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'

const JoinSalonPage = () => {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [salonInfo, setSalonInfo] = useState(null)
  const [joined, setJoined] = useState(false)
  const [entryMethod, setEntryMethod] = useState('manual') // 'manual' or 'camera'

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
      } else {
        toast.success(result.message)
      }
      
      setJoined(true)
      
      // Redirect to salon details after 2 seconds
      setTimeout(() => {
        navigate(`/salon/${result.data.salon.id}`)
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'Failed to join salon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <QrCode className="mx-auto text-primary-600 mb-4" size={64} />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Salon</h1>
        <p className="text-gray-600">
          Enter the salon's QR code to join their client list and start booking
        </p>
      </div>

      {/* Entry Method Selection */}
      {!salonInfo && !joined && (
        <div className="flex gap-4">
          <button
            onClick={() => setEntryMethod('manual')}
            className={`flex-1 p-6 border-2 rounded-lg transition-all ${
              entryMethod === 'manual'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <Keyboard className={`mx-auto mb-2 ${entryMethod === 'manual' ? 'text-primary-600' : 'text-gray-400'}`} size={40} />
            <p className="font-semibold text-gray-900">Manual Entry</p>
            <p className="text-sm text-gray-600 mt-1">Type the QR code</p>
          </button>

          <button
            onClick={() => setEntryMethod('camera')}
            className={`flex-1 p-6 border-2 rounded-lg transition-all ${
              entryMethod === 'camera'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <Camera className={`mx-auto mb-2 ${entryMethod === 'camera' ? 'text-primary-600' : 'text-gray-400'}`} size={40} />
            <p className="font-semibold text-gray-900">Scan QR Code</p>
            <p className="text-sm text-gray-600 mt-1">Use camera to scan</p>
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {entryMethod === 'camera' ? 'Scan QR Code' : 'Enter QR Code'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entryMethod === 'camera' ? (
              <QRScanner onScan={(code) => {
                setQrCode(code)
                handleCheckQR()
              }} />
            ) : (
              <>
                <Input
                  label="Salon QR Code"
                  placeholder="Enter the code from salon's QR..."
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  disabled={joined}
                />

                {!salonInfo && !joined && (
                  <Button onClick={handleCheckQR} loading={loading} fullWidth>
                    Check QR Code
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Salon Preview */}
      {salonInfo && !joined && (
        <Card className="border-2 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {salonInfo.logo ? (
                <img
                  src={uploadService.getImageUrl(salonInfo.logo)}
                  alt={salonInfo.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center">
                  <Store className="text-primary-300" size={40} />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {salonInfo.name}
                </h3>
                {salonInfo.description && (
                  <p className="text-gray-600 mb-3">{salonInfo.description}</p>
                )}
                
                {salonInfo.address && (
                  <p className="text-sm text-gray-600">
                    📍 {salonInfo.address.street}, {salonInfo.address.city}
                  </p>
                )}
                {salonInfo.phone && (
                  <p className="text-sm text-gray-600">
                    📞 {salonInfo.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleJoinSalon} loading={loading} fullWidth>
                <Check size={18} />
                Join This Salon
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSalonInfo(null)
                  setQrCode('')
                }}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {joined && salonInfo && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Check className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              Successfully Joined!
            </h3>
            <p className="text-green-700 mb-4">
              You are now a client of <strong>{salonInfo.name}</strong>
            </p>
            <p className="text-sm text-green-600">
              Redirecting to salon page...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!salonInfo && !joined && (
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2">How to join a salon:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Get the QR code from the salon (displayed at salon or shared by owner)</li>
              <li>Enter the code in the field above</li>
              <li>Review the salon information</li>
              <li>Click "Join This Salon"</li>
              <li>Start booking appointments!</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default JoinSalonPage

