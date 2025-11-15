import { Smartphone, Download } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const DownloadAppButton = () => {
  const { t } = useLanguage()

  const handleDownload = () => {
    // Get base URL from environment or use current origin
    let baseUrl = import.meta.env.VITE_API_URL || window.location.origin
    
    // Remove /api if present
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4)
    } else if (baseUrl.includes('/api')) {
      baseUrl = baseUrl.replace('/api', '')
    }
    
    // If no API URL is set, use current origin (for production)
    if (!import.meta.env.VITE_API_URL) {
      baseUrl = window.location.origin
    }
    
    // Direct download link to APK
    const apkUrl = `${baseUrl}/downloads/xaura.apk`
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = apkUrl
    link.download = 'xaura.apk'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleDownload}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
    >
      <div className="flex-shrink-0">
        <Smartphone size={20} />
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-sm">Download App</div>
        <div className="text-xs opacity-90">Get Xaura for Android</div>
      </div>
      <Download size={18} className="flex-shrink-0" />
    </button>
  )
}

export default DownloadAppButton

