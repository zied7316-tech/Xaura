import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        await html5QrCodeRef.current.clear()
      } catch (error) {
        console.error('Error stopping camera:', error)
      }
      html5QrCodeRef.current = null
      setHtml5QrCode(null)
    }
    setScanning(false)
  }, [])

  const startCamera = () => {
    // Just set scanning to true - useEffect will handle initialization
    setScanning(true)
  }

  // Initialize camera when scanning becomes true and element is available
  useEffect(() => {
    if (scanning && !html5QrCode) {
      const initCamera = async () => {
        try {
          // Wait a bit for DOM to update
          await new Promise(resolve => setTimeout(resolve, 200))
          
          const element = document.getElementById('qr-reader')
          if (!element) {
            console.error('QR reader element not found')
            setScanning(false)
            toast.error('Failed to initialize camera. Please try again.')
            return
          }

          const html5QrCodeInstance = new Html5Qrcode('qr-reader')
          html5QrCodeRef.current = html5QrCodeInstance
          setHtml5QrCode(html5QrCodeInstance)

          await html5QrCodeInstance.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // QR code detected!
              // Extract QR code from URL if it's a full URL
              let qrCode = decodedText
              try {
                if (decodedText.includes('/scan/')) {
                  const urlParts = decodedText.split('/scan/')
                  if (urlParts.length > 1) {
                    qrCode = urlParts[1].split('?')[0].split('#')[0]
                  }
                } else if (decodedText.startsWith('http') || decodedText.startsWith('https')) {
                  const url = new URL(decodedText)
                  const pathParts = url.pathname.split('/')
                  qrCode = pathParts[pathParts.length - 1] || decodedText
                }
              } catch (error) {
                console.log('Using original QR code:', decodedText)
              }

              if (onScan) {
                onScan(qrCode)
              }
              // Stop camera after successful scan
              if (html5QrCodeRef.current) {
                try {
                  await html5QrCodeRef.current.stop()
                  await html5QrCodeRef.current.clear()
                } catch (error) {
                  console.error('Error stopping camera:', error)
                }
                html5QrCodeRef.current = null
                setHtml5QrCode(null)
              }
              setScanning(false)
              toast.success('QR code scanned successfully!')
            },
            (errorMessage) => {
              // Ignore scanning errors (they're normal while scanning)
            }
          )
        } catch (error) {
          console.error('Camera error:', error)
          toast.error('Unable to access camera. Please use manual code entry.')
          setScanning(false)
        }
      }
      
      initCamera()
    }
  }, [scanning, html5QrCode, onScan, stopCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
        html5QrCodeRef.current.clear().catch(() => {})
      }
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
        <div className="relative" ref={scannerRef}>
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" style={{ minHeight: '300px' }}></div>
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

