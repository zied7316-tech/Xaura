import { QRCodeSVG } from 'qrcode.react'
import { Printer, Download, Smartphone, Calendar, Clock, Sparkles, Star } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const PrintableQRPoster = ({ salon, qrCode, bookingLink, onPrint, onDownload }) => {
  const handlePrint = () => {
    window.print()
    if (onPrint) onPrint()
    toast.success('Preparing for print...')
  }

  const handleDownloadPDF = () => {
    // This will be handled by the parent component to generate PDF
    if (onDownload) {
      onDownload()
    }
  }

  return (
    <>
      {/* Print Actions - Hidden when printing */}
      <div className="print:hidden mb-6 flex gap-4 flex-wrap">
        <Button onClick={handlePrint} size="lg" className="flex items-center gap-2">
          <Printer size={20} />
          Print Poster
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline" size="lg" className="flex items-center gap-2">
          <Download size={20} />
          Download as PDF
        </Button>
        <div className="flex-1" />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Printing Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Use A4 or Letter size paper</li>
            <li>Print in color for best results</li>
            <li>Set margins to "None" or "Minimum"</li>
            <li>Consider laminating for durability</li>
          </ul>
        </div>
      </div>

      {/* Printable Poster */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:bg-white" id="qr-poster">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 p-8 text-white print:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 print:text-3xl">{salon?.name || 'Our Salon'}</h1>
              {salon?.description && (
                <p className="text-xl text-white/90 print:text-lg">{salon.description}</p>
              )}
            </div>
            {salon?.logo && (
              <img
                src={salon.logo}
                alt={salon.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg print:w-20 print:h-20"
              />
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-white/90 print:text-sm">
            {salon?.address && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📍</span>
                <span>{salon.address.city}</span>
              </div>
            )}
            {salon?.phone && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">📞</span>
                <span>{salon.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 print:p-6">
          {/* Call to Action */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-50 to-purple-50 px-6 py-3 rounded-full mb-4 print:bg-gray-100">
              <Smartphone className="text-primary-600" size={24} />
              <h2 className="text-3xl font-bold text-gray-900 print:text-2xl">
                Scan to Book Instantly
              </h2>
            </div>
            <p className="text-xl text-gray-600 print:text-lg">
              No app download required • Book in seconds
            </p>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8 print:flex-col print:gap-6">
            {/* QR Code */}
            <div className="bg-white p-6 rounded-2xl border-4 border-primary-200 shadow-xl print:shadow-lg">
              <QRCodeSVG 
                value={bookingLink}
                size={280}
                level="H"
                includeMargin={true}
                className="print:w-full print:h-auto"
              />
            </div>

            {/* Features List */}
            <div className="flex-1 max-w-md space-y-4 print:max-w-full">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 print:bg-gray-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-xl">
                  <Sparkles className="text-primary-600" size={24} />
                  Why Scan Our QR Code?
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold print:w-6 print:h-6 print:text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Instant Booking</p>
                      <p className="text-sm text-gray-600">Book your appointment in seconds</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold print:w-6 print:h-6 print:text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">No App Required</p>
                      <p className="text-sm text-gray-600">Works directly in your browser</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold print:w-6 print:h-6 print:text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">24/7 Availability</p>
                      <p className="text-sm text-gray-600">Book anytime, anywhere</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold print:w-6 print:h-6 print:text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Easy Management</p>
                      <p className="text-sm text-gray-600">View and manage all your bookings</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 print:bg-white print:border print:p-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 print:text-lg">
              <Star className="text-yellow-500" size={24} />
              How to Use:
            </h3>
            <div className="grid md:grid-cols-4 gap-4 print:grid-cols-2">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl print:w-10 print:h-10 print:text-lg">
                  1
                </div>
                <p className="text-sm font-semibold text-gray-900">Open Camera</p>
                <p className="text-xs text-gray-600 mt-1">or QR scanner app</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl print:w-10 print:h-10 print:text-lg">
                  2
                </div>
                <p className="text-sm font-semibold text-gray-900">Scan QR Code</p>
                <p className="text-xs text-gray-600 mt-1">Point camera at code</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl print:w-10 print:h-10 print:text-lg">
                  3
                </div>
                <p className="text-sm font-semibold text-gray-900">Select Service</p>
                <p className="text-xs text-gray-600 mt-1">Choose your service</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl print:w-10 print:h-10 print:text-lg">
                  4
                </div>
                <p className="text-sm font-semibold text-gray-900">Book & Confirm</p>
                <p className="text-xs text-gray-600 mt-1">Choose date & time</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center print:mt-6 print:pt-4">
            <p className="text-gray-600 text-sm print:text-xs">
              Powered by <span className="font-bold text-primary-600">Xaura</span> - Smart Salon Management
            </p>
            {qrCode && (
              <p className="text-gray-500 text-xs mt-2 print:text-xs">
                Manual Code: <span className="font-mono font-semibold">{qrCode}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden;
          }
          
          /* Show only the QR poster */
          #qr-poster,
          #qr-poster * {
            visibility: visible;
          }
          
          /* Hide layout elements */
          nav,
          aside,
          header,
          .sidebar,
          .navbar,
          .mobile-bottom-nav,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset body styles */
          body {
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible;
          }
          
          /* QR Poster styling */
          #qr-poster {
            page-break-inside: avoid;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            position: absolute;
            left: 0;
            top: 0;
          }
          
          /* Page settings */
          @page {
            size: A4;
            margin: 0.5cm;
          }
        }
      `}</style>
    </>
  )
}

export default PrintableQRPoster

