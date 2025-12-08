import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { salonService } from '../../services/salonService'
import { uploadService } from '../../services/uploadService'
import Button from '../ui/Button'
import PrintableQRPoster from '../qr/PrintableQRPoster'
import { Download, Share2, Copy, Check, Printer, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const QRCodeDisplay = ({ salonId, qrCode, slug }) => {
  const [qrImage, setQrImage] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salon, setSalon] = useState(null)
  const [showPoster, setShowPoster] = useState(false)

  const baseUrl = window.location.origin

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch salon to get slug and details if not provided
        if (salonId) {
          const salonData = await salonService.getSalonById(salonId)
          setSalon(salonData)
        }
        
        // Fetch QR image
        if (salonId) {
          const data = await salonService.getQRCodeImage(salonId)
          setQrImage(data.qrCodeImage)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (salonId) {
      fetchData()
    }
  }, [salonId, slug])
  
  // Use salon slug if available, otherwise use prop
  const finalSlug = slug || salon?.slug
  const finalBookingLink = finalSlug 
    ? `${baseUrl}/SALON/${finalSlug}` 
    : `${baseUrl}/scan/${qrCode}`

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      
      const downloadLink = document.createElement('a')
      downloadLink.download = `salon-qr-code-${qrCode}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    toast.success('QR Code downloaded!')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(finalBookingLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Book an Appointment',
          text: 'Scan this QR code or click the link to book an appointment at our salon',
          url: finalBookingLink,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      handleCopyLink()
    }
  }

  const handleDownloadPDF = () => {
    // For now, just trigger print - PDF generation can be added later
    window.print()
    toast.success('Use your browser\'s print dialog to save as PDF')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Show printable poster view
  if (showPoster) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setShowPoster(false)}
          className="mb-4"
        >
          ← Back to QR Code
        </Button>
        <PrintableQRPoster
          salon={{
            ...salon,
            logo: salon?.logo ? uploadService.getImageUrl(salon.logo) : null
          }}
          qrCode={qrCode}
          bookingLink={finalBookingLink}
          onPrint={() => window.print()}
          onDownload={handleDownloadPDF}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions Header */}
      <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-4 border border-primary-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">QR Code & Booking Link</h3>
            <p className="text-sm text-gray-600">Share with clients to enable easy booking</p>
          </div>
          <Button
            onClick={() => setShowPoster(true)}
            className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
          >
            <Printer size={18} className="mr-2" />
            Create Printable Poster
          </Button>
        </div>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
        <QRCodeSVG 
          id="qr-code-svg"
          value={finalBookingLink} 
          size={256}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* QR Code Value */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          QR Code (for manual entry)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={qrCode}
            readOnly
            className="input flex-1 bg-white font-mono text-lg"
          />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(qrCode)
              toast.success('QR code copied!')
            }}
            className="shrink-0"
          >
            <Copy size={20} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Clients can enter this code in "Join via QR" to join your salon
        </p>
      </div>

      {/* QR Code URL */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Booking Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={finalBookingLink}
            readOnly
            className="input flex-1 bg-white"
          />
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link directly with clients for instant booking
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button fullWidth onClick={handleDownload} variant="outline">
          <Download size={20} className="mr-2" />
          Download QR Code
        </Button>
        <Button variant="outline" fullWidth onClick={handleShare}>
          <Share2 size={20} className="mr-2" />
          Share Link
        </Button>
        <Button 
          fullWidth 
          onClick={() => setShowPoster(true)}
          className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
        >
          <FileText size={20} className="mr-2" />
          Printable Poster
        </Button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          How clients can join:
        </h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Client goes to "Join via QR" in their account</li>
          <li>They enter your QR code (shown above) or scan it</li>
          <li>They're added to your client list automatically</li>
          <li>They can now book appointments at your salon</li>
          <li>You can track them in "Client List" page</li>
        </ul>
        <div className="mt-3 pt-3 border-t border-blue-300">
          <p className="text-sm font-semibold text-blue-900 mb-1">💡 Pro Tip:</p>
          <p className="text-sm text-blue-800">
            Use the "Create Printable Poster" button to generate a professional, branded poster 
            that you can print and display at your salon. It includes instructions and highlights 
            the benefits for your clients!
          </p>
        </div>
      </div>
    </div>
  )
}

export default QRCodeDisplay
