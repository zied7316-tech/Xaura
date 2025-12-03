import { Smartphone, Download } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

const DownloadAppButton = () => {
  const { t } = useLanguage()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setDownloading(true)
      
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
      
      // Verify file exists first
      try {
        const response = await fetch(apkUrl, { method: 'HEAD' })
        if (!response.ok) {
          throw new Error('APK file not found')
        }
      } catch (error) {
        toast.error('APK file not available. Please contact support.')
        setDownloading(false)
        return
      }
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = apkUrl
      link.download = 'xaura.apk'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download APK. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex-shrink-0">
        {downloading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <Smartphone size={20} />
        )}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-sm">
          {downloading ? 'Downloading...' : 'Download App'}
        </div>
        <div className="text-xs opacity-90">Get Xaura for Android</div>
      </div>
      <Download size={18} className="flex-shrink-0" />
    </button>
  )
}

export default DownloadAppButton

