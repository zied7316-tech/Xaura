import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState(null)
  const qrReaderRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const isInitializingRef = useRef(false)

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
    isInitializingRef.current = false
    setScanning(false)
  }, [])

  const startCamera = () => {
    if (isInitializingRef.current) {
      return // Prevent multiple initializations
    }
    setScanning(true)
  }

  // Initialize camera when element ref is set and scanning is true
  useEffect(() => {
    // Only initialize if:
    // 1. Scanning is true
    // 2. We don't already have an instance
    // 3. The ref element exists
    // 4. We're not already initializing
    if (!scanning || html5QrCode || !qrReaderRef.current || isInitializingRef.current) {
      return
    }

    isInitializingRef.current = true

    const initCamera = async () => {
      try {
        // Wait for React to fully render and flush DOM updates
        // Use requestAnimationFrame to ensure DOM is ready
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 150)
            })
          })
        })

        // Double-check element still exists
        const element = qrReaderRef.current
        if (!element) {
          console.error('QR reader element not found after wait')
          isInitializingRef.current = false
          setScanning(false)
          toast.error('Failed to initialize camera. Please try again.')
          return
        }

        // Verify element is in DOM
        if (!document.body.contains(element)) {
          console.error('QR reader element not in DOM')
          isInitializingRef.current = false
          setScanning(false)
          toast.error('Failed to initialize camera. Please try again.')
          return
        }

        // Now safely create Html5Qrcode instance
        const html5QrCodeInstance = new Html5Qrcode(element.id || 'qr-reader')
        html5QrCodeRef.current = html5QrCodeInstance
        setHtml5QrCode(html5QrCodeInstance)

        await html5QrCodeInstance.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            // QR code detected!
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
            isInitializingRef.current = false
            setScanning(false)
            toast.success('QR code scanned successfully!')
          },
          (errorMessage) => {
            // Ignore scanning errors (they're normal while scanning)
          }
        )
      } catch (error) {
        console.error('Camera error:', error)
        isInitializingRef.current = false
        toast.error('Unable to access camera. Please use manual code entry.')
        setScanning(false)
      }
    }
    
    initCamera()
  }, [scanning, html5QrCode, onScan])

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
        <div className="relative">
          <div 
            ref={qrReaderRef}
            id="qr-reader" 
            className="w-full rounded-lg overflow-hidden" 
            style={{ minHeight: '300px' }}
          ></div>
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

