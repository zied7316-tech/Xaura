import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const QRScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState(null)
  const [scanned, setScanned] = useState(false)
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
    setScanned(false)
  }, [])

  const startCamera = () => {
    if (isInitializingRef.current) {
      return
    }
    setScanning(true)
    setScanned(false)
  }

  useEffect(() => {
    if (!scanning || html5QrCode || !qrReaderRef.current || isInitializingRef.current) {
      return
    }

    isInitializingRef.current = true

    const initCamera = async () => {
      try {
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 150)
            })
          })
        })

        const element = qrReaderRef.current
        if (!element || !document.body.contains(element)) {
          console.error('QR reader element not found or not in DOM')
          isInitializingRef.current = false
          setScanning(false)
          toast.error('Failed to initialize camera. Please try again.')
          return
        }

        const html5QrCodeInstance = new Html5Qrcode(element.id || 'qr-reader')
        html5QrCodeRef.current = html5QrCodeInstance
        setHtml5QrCode(html5QrCodeInstance)

        await html5QrCodeInstance.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0
          },
          async (decodedText) => {
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

            // Show success feedback
            setScanned(true)
            
            if (onScan) {
              onScan(qrCode)
            }
            
            // Stop camera after successful scan
            setTimeout(async () => {
              if (html5QrCodeRef.current) {
                try {
                  await html5QrCodeRef.current.stop()
                  await html5QrCodeRef.current.clear()
                } catch (error) {
                  console.error('Error stopping camera:', error)
                }
                html5QrCodeRef.current = null
              }
              isInitializingRef.current = false
              setScanning(false)
              toast.success('QR code scanned successfully!')
            }, 1000)
          },
          (errorMessage) => {
            // Ignore scanning errors (normal while scanning)
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
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full mb-6 shadow-lg">
            <Camera className="text-white" size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Scan</h3>
          <p className="text-gray-600 mb-6">Click below to start your camera</p>
          <Button onClick={startCamera} size="lg" className="px-8">
            <Camera size={20} className="mr-2" />
            Start Camera
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Make sure to allow camera access when prompted
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden border-4 border-primary-500 shadow-2xl">
            <div 
              ref={qrReaderRef}
              id="qr-reader" 
              className="w-full" 
              style={{ minHeight: '350px' }}
            ></div>
            
            {/* Scanning Overlay */}
            {!scanned && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame */}
                  <div className="w-64 h-64 border-4 border-primary-400 rounded-xl">
                    {/* Corner decorations */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                  </div>
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-scan-line"></div>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scanned && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center z-20 animate-fade-in">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-bounce">
                    <CheckCircle2 className="text-green-500" size={48} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Success!</h3>
                  <p className="text-lg">QR Code Scanned</p>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="absolute top-4 right-4 z-30">
              <button
                onClick={() => {
                  stopCamera()
                  if (onClose) onClose()
                }}
                className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-110 transition-transform"
                title="Close Scanner"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Scanning Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Position the QR code within the frame</li>
                  <li>Keep your device steady for best results</li>
                  <li>Ensure good lighting</li>
                  <li>The scan will happen automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-bounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-bounce {
          animation: scale-bounce 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}

export default QRScanner
