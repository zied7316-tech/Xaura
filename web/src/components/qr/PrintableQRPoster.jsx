import { QRCodeSVG } from 'qrcode.react'
import { Printer, Download, Smartphone, Calendar, Clock, Sparkles, Star, Zap, Shield, Globe } from 'lucide-react'
import Button from '../ui/Button'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

const PrintableQRPoster = ({ salon, qrCode, bookingLink, onPrint, onDownload }) => {
  const { language, t } = useLanguage()
  const isFrench = language === 'fr'
  const handlePrint = () => {
    window.print()
    if (onPrint) onPrint()
    toast.success(isFrench ? 'Préparation de l\'impression...' : 'Preparing for print...')
  }

  // Translations
  const translations = {
    printPoster: isFrench ? 'Imprimer l\'Affiche' : 'Print Poster',
    downloadPDF: isFrench ? 'Télécharger en PDF' : 'Download as PDF',
    printingTips: isFrench ? '💡 Conseils d\'impression :' : '💡 Printing Tips:',
    useA4: isFrench ? 'Utilisez du papier A4 ou Letter' : 'Use A4 or Letter size paper',
    printColor: isFrench ? 'Imprimez en couleur pour de meilleurs résultats' : 'Print in color for best results',
    setMargins: isFrench ? 'Définissez les marges sur "Aucune" ou "Minimum"' : 'Set margins to "None" or "Minimum"',
    considerLaminating: isFrench ? 'Envisagez de plastifier pour la durabilité' : 'Consider laminating for durability',
    scanToBook: isFrench ? 'Scannez pour Réserver Instantanément' : 'Scan to Book Instantly',
    noAppRequired: isFrench ? 'Aucune application requise • Réservez en quelques secondes' : 'No app download required • Book in seconds',
    whyScan: isFrench ? 'Pourquoi Scanner Notre Code QR ?' : 'Why Scan Our QR Code?',
    instantBooking: isFrench ? 'Réservation Instantanée' : 'Instant Booking',
    instantBookingDesc: isFrench ? 'Réservez votre rendez-vous en quelques secondes' : 'Book your appointment in seconds',
    noApp: isFrench ? 'Aucune Application Requise' : 'No App Required',
    noAppDesc: isFrench ? 'Fonctionne directement dans votre navigateur' : 'Works directly in your browser',
    availability247: isFrench ? 'Disponibilité 24/7' : '24/7 Availability',
    availability247Desc: isFrench ? 'Réservez à tout moment, n\'importe où' : 'Book anytime, anywhere',
    easyManagement: isFrench ? 'Gestion Facile' : 'Easy Management',
    easyManagementDesc: isFrench ? 'Visualisez et gérez tous vos rendez-vous' : 'View and manage all your bookings',
    howToUse: isFrench ? 'Comment Utiliser :' : 'How to Use:',
    openCamera: isFrench ? 'Ouvrir l\'Appareil Photo' : 'Open Camera',
    openCameraDesc: isFrench ? 'ou application de scan QR' : 'or QR scanner app',
    scanQR: isFrench ? 'Scanner le Code QR' : 'Scan QR Code',
    scanQRDesc: isFrench ? 'Pointez l\'appareil photo vers le code' : 'Point camera at code',
    selectService: isFrench ? 'Sélectionner un Service' : 'Select Service',
    selectServiceDesc: isFrench ? 'Choisissez votre service' : 'Choose your service',
    bookConfirm: isFrench ? 'Réserver et Confirmer' : 'Book & Confirm',
    bookConfirmDesc: isFrench ? 'Choisissez la date et l\'heure' : 'Choose date & time',
    poweredBy: isFrench ? 'Propulsé par' : 'Powered by',
    smartSalon: isFrench ? 'Gestion Intelligente de Salon' : 'Smart Salon Management',
    manualCode: isFrench ? 'Code Manuel :' : 'Manual Code:'
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
        <Button onClick={handlePrint} size="lg" className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-lg">
          <Printer size={20} />
          {translations.printPoster}
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline" size="lg" className="flex items-center gap-2 border-2 hover:bg-gray-50">
          <Download size={20} />
          {translations.downloadPDF}
        </Button>
        <div className="flex-1" />
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 text-sm text-blue-800 shadow-sm">
          <p className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            {translations.printingTips}
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-blue-700">
            <li>{translations.useA4}</li>
            <li>{translations.printColor}</li>
            <li>{translations.setMargins}</li>
            <li>{translations.considerLaminating}</li>
          </ul>
        </div>
      </div>

      {/* Printable Poster */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none print:bg-white border-2 border-gray-200" id="qr-poster">
        {/* Header Section - Enhanced with more shine */}
        <div className="relative bg-gradient-to-r from-primary-600 via-purple-600 via-pink-600 to-orange-500 p-8 text-white print:p-6 overflow-hidden">
          {/* Shine effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="relative flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-5xl font-extrabold mb-3 print:text-3xl drop-shadow-lg tracking-tight">
                {salon?.name || (isFrench ? 'Notre Salon' : 'Our Salon')}
              </h1>
              {salon?.description && (
                <p className="text-xl text-white/95 print:text-lg font-medium drop-shadow-md">{salon.description}</p>
              )}
            </div>
            {salon?.logo && (
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl"></div>
                <img
                  src={salon.logo}
                  alt={salon.name}
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-white/50 print:w-20 print:h-20"
                />
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center gap-6 text-white/95 print:text-sm font-medium">
            {salon?.address && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-2xl">📍</span>
                <span>{salon.address.city}</span>
              </div>
            )}
            {salon?.phone && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-2xl">📞</span>
                <span>{salon.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 print:p-6 bg-gradient-to-b from-white to-gray-50">
          {/* Call to Action - Enhanced */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-50 via-purple-50 to-pink-50 px-8 py-4 rounded-2xl mb-4 print:bg-gray-100 shadow-lg border-2 border-primary-100">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl shadow-md">
                <Smartphone className="text-white" size={28} />
              </div>
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent print:text-2xl print:bg-none print:text-gray-900">
                {translations.scanToBook}
              </h2>
            </div>
            <p className="text-xl text-gray-700 print:text-lg font-medium">
              {translations.noAppRequired}
            </p>
          </div>

          {/* QR Code Section - Enhanced */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 mb-10 print:flex-col print:gap-6">
            {/* QR Code - More beautiful */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 via-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30 -z-10"></div>
              <div className="relative bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl border-4 border-primary-300 shadow-2xl print:shadow-lg ring-4 ring-primary-100">
                <QRCodeSVG 
                  value={bookingLink}
                  size={300}
                  level="H"
                  includeMargin={true}
                  className="print:w-full print:h-auto"
                />
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-lg"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-lg"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-lg"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-lg"></div>
              </div>
            </div>

            {/* Features List - Enhanced */}
            <div className="flex-1 max-w-md space-y-4 print:max-w-full">
              <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-7 rounded-2xl border-2 border-blue-300 shadow-xl print:bg-gray-50 print:border print:p-4 overflow-hidden">
                {/* Decorative background pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-purple-200/30 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative">
                  <h3 className="text-2xl font-extrabold text-gray-900 mb-5 flex items-center gap-3 print:text-xl">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg shadow-md">
                      <Sparkles className="text-white" size={22} />
                    </div>
                    {translations.whyScan}
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold shadow-lg group-hover:scale-110 transition-transform print:w-6 print:h-6 print:text-sm print:rounded-lg">
                        <Zap size={18} className="print:w-3 print:h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{translations.instantBooking}</p>
                        <p className="text-sm text-gray-600 mt-1">{translations.instantBookingDesc}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold shadow-lg group-hover:scale-110 transition-transform print:w-6 print:h-6 print:text-sm print:rounded-lg">
                        <Globe size={18} className="print:w-3 print:h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{translations.noApp}</p>
                        <p className="text-sm text-gray-600 mt-1">{translations.noAppDesc}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold shadow-lg group-hover:scale-110 transition-transform print:w-6 print:h-6 print:text-sm print:rounded-lg">
                        <Clock size={18} className="print:w-3 print:h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{translations.availability247}</p>
                        <p className="text-sm text-gray-600 mt-1">{translations.availability247Desc}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold shadow-lg group-hover:scale-110 transition-transform print:w-6 print:h-6 print:text-sm print:rounded-lg">
                        <Shield size={18} className="print:w-3 print:h-3" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{translations.easyManagement}</p>
                        <p className="text-sm text-gray-600 mt-1">{translations.easyManagementDesc}</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions - Enhanced */}
          <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-7 border-2 border-gray-300 shadow-xl print:bg-white print:border print:p-4 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-200/40 to-orange-200/40 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-purple-200/30 rounded-full blur-xl"></div>
            
            <div className="relative">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3 print:text-lg">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg shadow-md">
                  <Star className="text-white" size={22} />
                </div>
                {translations.howToUse}
              </h3>
              <div className="grid md:grid-cols-4 gap-6 print:grid-cols-2">
                <div className="text-center group">
                  <div className="relative mx-auto mb-3">
                    <div className="absolute inset-0 bg-primary-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-full flex items-center justify-center font-extrabold text-xl shadow-xl ring-4 ring-primary-100 print:w-10 print:h-10 print:text-lg">
                      1
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{translations.openCamera}</p>
                  <p className="text-xs text-gray-600 mt-1">{translations.openCameraDesc}</p>
                </div>
                <div className="text-center group">
                  <div className="relative mx-auto mb-3">
                    <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center font-extrabold text-xl shadow-xl ring-4 ring-blue-100 print:w-10 print:h-10 print:text-lg">
                      2
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{translations.scanQR}</p>
                  <p className="text-xs text-gray-600 mt-1">{translations.scanQRDesc}</p>
                </div>
                <div className="text-center group">
                  <div className="relative mx-auto mb-3">
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full flex items-center justify-center font-extrabold text-xl shadow-xl ring-4 ring-purple-100 print:w-10 print:h-10 print:text-lg">
                      3
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{translations.selectService}</p>
                  <p className="text-xs text-gray-600 mt-1">{translations.selectServiceDesc}</p>
                </div>
                <div className="text-center group">
                  <div className="relative mx-auto mb-3">
                    <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center font-extrabold text-xl shadow-xl ring-4 ring-green-100 print:w-10 print:h-10 print:text-lg">
                      4
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{translations.bookConfirm}</p>
                  <p className="text-xs text-gray-600 mt-1">{translations.bookConfirmDesc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Enhanced */}
          <div className="mt-10 pt-8 border-t-2 border-gray-300 text-center print:mt-6 print:pt-4 bg-gradient-to-r from-transparent via-gray-50 to-transparent">
            <p className="text-gray-700 text-sm print:text-xs font-medium">
              {translations.poweredBy} <span className="font-extrabold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent print:bg-none print:text-primary-600">Xaura</span> - {translations.smartSalon}
            </p>
            {qrCode && (
              <p className="text-gray-600 text-xs mt-3 print:text-xs font-medium">
                {translations.manualCode} <span className="font-mono font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">{qrCode}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide layout elements */
          nav,
          aside,
          header,
          .sidebar,
          .navbar,
          .mobile-bottom-nav,
          .print\\:hidden {
            display: none !important;
          }
          
          /* Hide browser print headers/footers */
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Reset body styles */
          body {
            margin: 0;
            padding: 0;
            background: white;
            overflow: visible;
          }
          
          /* Hide everything except the QR poster */
          body > *:not(#qr-poster) {
            display: none !important;
          }
          
          /* Show the QR poster and all its content */
          #qr-poster {
            display: block !important;
            visibility: visible !important;
            page-break-inside: avoid;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            position: relative;
            left: 0;
            top: 0;
          }
          
          /* Make all children of QR poster visible and preserve their display types */
          #qr-poster * {
            visibility: visible !important;
          }
          
          /* Preserve flex layouts */
          #qr-poster .flex {
            display: flex !important;
          }
          
          /* Preserve grid layouts */
          #qr-poster .grid {
            display: grid !important;
          }
          
          /* Preserve inline and inline-block elements */
          #qr-poster span,
          #qr-poster a {
            display: inline !important;
          }
          
          /* Ensure block elements are visible */
          #qr-poster div,
          #qr-poster p,
          #qr-poster h1,
          #qr-poster h2,
          #qr-poster h3,
          #qr-poster ul,
          #qr-poster li {
            display: block !important;
          }
          
          /* Ensure images and SVGs are visible */
          #qr-poster img,
          #qr-poster svg {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Hide decorative blur effects when printing */
          #qr-poster .blur-xl,
          #qr-poster .blur-2xl,
          #qr-poster .blur-3xl {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}

export default PrintableQRPoster

