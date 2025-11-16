import { useState, useEffect } from 'react'
import { pushNotificationService } from '../../services/pushNotificationService'
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission 
} from '../../services/firebaseService'
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PushNotificationSetup = () => {
  const [permission, setPermission] = useState('default')
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    checkNotificationSupport()
    checkPermission()
  }, [])

  const checkNotificationSupport = () => {
    const supported = isNotificationSupported()
    setIsSupported(supported)
  }

  const checkPermission = () => {
    const currentPermission = getNotificationPermission()
    setPermission(currentPermission)
    
    // Check if already registered
    const storedToken = localStorage.getItem('fcm_token')
    if (storedToken && currentPermission === 'granted') {
      setIsRegistered(true)
    }
  }

  const handleEnableNotifications = async () => {
    try {
      setIsRegistering(true)

      // Request permission
      const newPermission = await requestNotificationPermission()
      setPermission(newPermission)

      if (newPermission !== 'granted') {
        toast.error('Notification permission denied. Please enable it in your browser settings.')
        setIsRegistering(false)
        return
      }

      // Initialize push notifications
      const result = await pushNotificationService.initialize()
      
      if (result.success) {
        localStorage.setItem('fcm_token', result.token)
        setIsRegistered(true)
        toast.success('Push notifications enabled! 🎉')
      } else {
        toast.error(result.message || 'Failed to enable push notifications')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
      toast.error('Failed to enable push notifications')
    } finally {
      setIsRegistering(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle size={20} />
          <p className="text-sm">Push notifications are not supported in this browser.</p>
        </div>
      </div>
    )
  }

  if (isRegistered) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle size={20} />
          <p className="text-sm font-medium">Push notifications are enabled!</p>
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-2 text-red-800">
          <XCircle size={20} className="mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Notifications are blocked</p>
            <p className="text-xs">
              Please enable notifications in your browser settings, then refresh the page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Bell size={20} className="text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Enable Push Notifications
          </h4>
          <p className="text-xs text-blue-700 mb-3">
            Get instant notifications even when the browser is closed. You'll be notified about new appointments, reminders, and important updates.
          </p>
          <button
            onClick={handleEnableNotifications}
            disabled={isRegistering}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRegistering ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PushNotificationSetup


