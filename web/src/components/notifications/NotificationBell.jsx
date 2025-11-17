import { useState, useEffect, useRef } from 'react'
import { notificationService } from '../../services/notificationService'
import { useAuth } from '../../context/AuthContext'
import { 
  Bell, X, Check, CheckCheck, Trash2, Calendar, 
  DollarSign, Users, Package, AlertCircle, Star 
} from 'lucide-react'
import { formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const NotificationBell = () => {
  const { isOwner, isWorker, isClient } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const audioRef = useRef(null)

  // Helper function to get notification sound based on user role
  const getNotificationSound = () => {
    if (isOwner) {
      return '/sounds/owner-notification.mp3.mp3'
    } else if (isWorker) {
      return '/sounds/worker-notification.mp3.mp3'
    } else if (isClient) {
      return '/sounds/client-notification.mp3.mp3'
    }
    return '/sounds/notification.mp3' // Default fallback
  }

  // Function to play notification sound
  const playNotificationSound = () => {
    try {
      const soundFile = getNotificationSound()
      console.log('🔊 Attempting to play sound:', soundFile)
      console.log('🔊 User role - Owner:', isOwner, 'Worker:', isWorker, 'Client:', isClient)
      
      // Create new audio instance
      const audio = new Audio(soundFile)
      
      // Set volume (0.0 to 1.0)
      audio.volume = 0.7
      
      // Preload the audio
      audio.preload = 'auto'
      
      // Handle audio events
      audio.addEventListener('loadeddata', () => {
        console.log('🔊 Audio loaded successfully')
      })
      
      audio.addEventListener('error', (error) => {
        console.error('🔊 Error loading audio:', error)
        console.error('🔊 Audio file path:', soundFile)
        console.error('🔊 Audio error details:', audio.error)
      })
      
      audio.addEventListener('canplaythrough', () => {
        console.log('🔊 Audio can play through')
      })
      
      audio.addEventListener('play', () => {
        console.log('🔊 Sound started playing')
      })
      
      audio.addEventListener('ended', () => {
        console.log('🔊 Sound finished playing')
      })
      
      // Try to load first, then play
      audio.load()
      
      // Play the sound
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sound playing successfully')
          })
          .catch((error) => {
            console.error('🔊 Error playing sound:', error)
            console.error('🔊 Error name:', error.name)
            console.error('🔊 Error message:', error.message)
            console.error('🔊 This might be due to browser autoplay policy. User interaction may be required.')
            console.error('🔊 Try clicking anywhere on the page first, then trigger a notification.')
          })
      }
      
      // Store reference for cleanup if needed
      audioRef.current = audio
    } catch (error) {
      console.error('🔊 Error creating audio:', error)
      console.error('🔊 Error stack:', error.stack)
    }
  }

  useEffect(() => {
    loadNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(true) // Play sound if new notifications
    }, 30000)
    
    // Listen for push notifications (foreground)
    const setupPushListener = async () => {
      try {
        const { setupMessageListener } = await import('../../services/firebaseService')
        setupMessageListener((payload) => {
          if (payload) {
            // Play notification sound
            playNotificationSound()
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const soundFile = getNotificationSound()
              new Notification(payload.notification?.title || 'New Notification', {
                body: payload.notification?.body || payload.data?.message,
                icon: payload.notification?.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: payload.data?.notificationId || Date.now().toString(),
                sound: soundFile
              })
            }
            
            // Show toast notification
            toast.success(payload.notification?.title || 'New notification', {
              duration: 5000
            })
            
            // Reload notifications
            loadNotifications()
          }
        })
      } catch (error) {
        console.error('Error setting up push listener:', error)
      }
    }
    
    setupPushListener()
    
    return () => {
      clearInterval(interval)
      // Cleanup audio if it exists
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async (playSoundOnNew = false) => {
    try {
      setLoading(true)
      const previousUnreadCount = unreadCount
      const response = await notificationService.getNotifications(20, false)
      
      // Handle different response structures
      let notifications = []
      let newUnreadCount = 0
      
      if (Array.isArray(response)) {
        // Response is directly an array
        notifications = response
        newUnreadCount = response.filter(n => !n.isRead).length
      } else if (response?.data && Array.isArray(response.data)) {
        // Response has data property
        notifications = response.data
        newUnreadCount = response.unreadCount || 0
      } else if (response?.success && Array.isArray(response.data)) {
        // Standard API response
        notifications = response.data
        newUnreadCount = response.unreadCount || 0
      }
      
      // Play sound if new unread notifications arrived
      if (playSoundOnNew && newUnreadCount > previousUnreadCount) {
        console.log('🔔 New notifications detected! Previous:', previousUnreadCount, 'New:', newUnreadCount)
        playNotificationSound()
      }
      
      setNotifications(notifications)
      setUnreadCount(newUnreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
      // Set empty arrays on error to prevent UI issues
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await notificationService.markAsRead(notificationId)
      loadNotifications()
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      toast.success('All marked as read')
      loadNotifications()
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await notificationService.deleteNotification(notificationId)
      loadNotifications()
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return
    
    try {
      await notificationService.clearAllNotifications()
      toast.success('All notifications cleared')
      loadNotifications()
    } catch (error) {
      toast.error('Failed to clear notifications')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_appointment':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_reminder':
        return <Calendar size={18} className="text-blue-600" />
      case 'payment_received':
        return <DollarSign size={18} className="text-green-600" />
      case 'low_stock':
        return <Package size={18} className="text-orange-600" />
      case 'new_client':
        return <Users size={18} className="text-purple-600" />
      case 'birthday_reminder':
        return <Star size={18} className="text-yellow-600" />
      default:
        return <Bell size={18} className="text-gray-600" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50'
      case 'high':
        return 'border-orange-500 bg-orange-50'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          const newState = !showDropdown
          setShowDropdown(newState)
          // Reload notifications when opening dropdown
          if (newState) {
            loadNotifications()
          }
        }}
        className="p-2 rounded-md text-gray-600 hover:bg-gray-100 relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-primary-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  Mark all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                  title="Clear all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? 'bg-primary-50' : 'hover:bg-gray-50'
                  } cursor-pointer transition-colors`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id, { stopPropagation: () => {} })}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.createdAt)} at {formatTime(notification.createdAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification._id, e)}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                              title="Mark as read"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification._id, e)}
                            className="text-xs text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 text-center border-t">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell




