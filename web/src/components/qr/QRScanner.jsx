import { useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState(null)

  const startCamera = async () => {
    try {
      const html5QrCodeInstance = new Html5Qrcode('qr-reader')
      setHtml5QrCode(html5QrCodeInstance)

      await html5QrCodeInstance.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR code detected!
          // Extract QR code from URL if it's a full URL (e.g., http://localhost:5173/scan/ABC123)
          let qrCode = decodedText
          try {
            // If it's a URL, extract the QR code from the path
            if (decodedText.includes('/scan/')) {
              const urlParts = decodedText.split('/scan/')
              if (urlParts.length > 1) {
                qrCode = urlParts[1].split('?')[0].split('#')[0] // Remove query params and hash
              }
            } else if (decodedText.startsWith('http') || decodedText.startsWith('https')) {
              // If it's a URL but different format, try to extract from pathname
              const url = new URL(decodedText)
              const pathParts = url.pathname.split('/')
              qrCode = pathParts[pathParts.length - 1] || decodedText
            }
          } catch (error) {
            // If URL parsing fails, use the original decoded text
            console.log('Using original QR code:', decodedText)
          }

          if (onScan) {
            onScan(qrCode)
          }
          stopCamera()
          toast.success('QR code scanned successfully!')
        },
        (errorMessage) => {
          // Ignore scanning errors (they're normal while scanning)
        }
      )

      setScanning(true)
    } catch (error) {
      console.error('Camera error:', error)
      toast.error('Unable to access camera. Please use manual code entry.')
      if (html5QrCode) {
        stopCamera()
      }
    }
  }

  const stopCamera = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop()
        await html5QrCode.clear()
      } catch (error) {
        console.error('Error stopping camera:', error)
      }
      setHtml5QrCode(null)
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (html5QrCode) {
        stopCamera()
      }
    }
  }, [html5QrCode])

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
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
          <div className="absolute top-2 right-2 z-10">
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
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        <p><strong>Note:</strong> QR code scanning requires camera access. If camera doesn't work, use manual code entry below.</p>
      </div>
    </div>
  )
}

export default QRScanner

