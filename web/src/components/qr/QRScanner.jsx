import { useState, useRef, useEffect } from 'react'
import { Camera, X } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const QRScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [stream, setStream] = useState(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setScanning(true)
      }
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Unable to access camera. Please use manual code entry.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      {!scanning ? (
        <div className="text-center py-8">
          <Camera className="mx-auto text-gray-400 mb-4" size={64} />
          <p className="text-gray-600 mb-4">Click below to start camera</p>
          <Button onClick={startCamera}>
            <Camera size={18} />
            Start Camera
          </Button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="absolute top-2 right-2">
            <button
              onClick={() => {
                stopCamera()
                if (onClose) onClose()
              }}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={20} />
            </button>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-primary-500 rounded-lg"></div>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        <p><strong>Note:</strong> QR code scanning requires camera access. If camera doesn't work, use manual code entry below.</p>
      </div>
    </div>
  )
}

export default QRScanner

