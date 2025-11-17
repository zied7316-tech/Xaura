import { useState, useEffect, useRef } from 'react'
import { notificationService } from '../../services/notificationService'
import { appointmentManagementService } from '../../services/appointmentManagementService'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, X, Check, CheckCheck, Trash2, Calendar, 
  DollarSign, Users, Package, AlertCircle, Star, CheckCircle, XCircle
} from 'lucide-react'
import { formatDate, formatTime } from '../../utils/helpers'
import { mapNotificationToAnimated } from '../../utils/notificationMapper'
import AnimatedNotification from './AnimatedNotification'
import toast from 'react-hot-toast'

const NotificationBell = () => {
  const { isOwner, isWorker, isClient, user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [seenNotificationIds, setSeenNotificationIds] = useState(new Set())
  const [processingAppointment, setProcessingAppointment] = useState(null)
  const [animatedNotifications, setAnimatedNotifications] = useState([])
  const dropdownRef = useRef(null)
  const audioRef = useRef(null)
  const audioUnlockedRef = useRef(false)

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

  // Unlock audio on first user interaction
  const unlockAudio = async () => {
    if (audioUnlockedRef.current) return true
    
    try {
      const soundFile = getNotificationSound()
      const audio = new Audio(soundFile)
      audio.volume = 0.7
      audio.preload = 'auto'
      
      // Try to play and immediately pause to unlock
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        await playPromise
        audio.pause()
        audio.currentTime = 0
        audioRef.current = audio
        audioUnlockedRef.current = true
        console.log('🔊 Audio unlocked successfully')
        return true
      }
    } catch (error) {
      console.log('🔊 Audio unlock failed (will retry on next interaction):', error.message)
      return false
    }
    return false
  }

  // Function to play notification sound
  const playNotificationSound = async () => {
    try {
      const soundFile = getNotificationSound()
      
      // If audio is not unlocked, try to unlock it first
      if (!audioUnlockedRef.current) {
        const unlocked = await unlockAudio()
        if (!unlocked) {
          console.log('🔊 Audio not unlocked yet, sound will play on next user interaction')
          return
        }
      }
      
      // Use existing unlocked audio or create new one
      let audio = audioRef.current
      
      if (!audio || audio.ended || audio.error) {
        // Create new audio instance if needed
        audio = new Audio(soundFile)
        audio.volume = 0.7
        audio.preload = 'auto'
        audioRef.current = audio
      }
      
      // Reset to beginning if already played
      if (audio.currentTime > 0) {
        audio.currentTime = 0
      }
      
      // Play the sound
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Sound playing successfully')
          })
          .catch((error) => {
            console.error('🔊 Error playing sound:', error)
            // If autoplay blocked, try to unlock on next interaction
            if (error.name === 'NotAllowedError') {
              audioUnlockedRef.current = false
              console.log('🔊 Audio needs to be unlocked. User interaction required.')
            }
          })
      }
    } catch (error) {
      console.error('🔊 Error creating audio:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
    
    // Unlock audio on first user interaction
    const unlockOnInteraction = () => {
      unlockAudio().then(() => {
        // Remove listeners after successful unlock
        document.removeEventListener('click', unlockOnInteraction)
        document.removeEventListener('touchstart', unlockOnInteraction)
      })
    }
    
    // Try to unlock audio on any user interaction
    document.addEventListener('click', unlockOnInteraction, { once: true })
    document.addEventListener('touchstart', unlockOnInteraction, { once: true })
    
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
            // Get notification ID from payload to prevent duplicate sound
            const notificationId = payload.data?.notificationId
            
            // Only play sound if we haven't seen this notification ID before
            if (notificationId && !seenNotificationIds.has(notificationId)) {
              // Mark as seen immediately to prevent duplicate sound
              setSeenNotificationIds(prev => new Set([...prev, notificationId]))
              
              // Play notification sound (only once per push notification)
              playNotificationSound()
            } else if (!notificationId) {
              // If no ID in payload, play sound anyway (fallback)
              playNotificationSound()
            }
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const soundFile = getNotificationSound()
              new Notification(payload.notification?.title || 'New Notification', {
                body: payload.notification?.body || payload.data?.message,
                icon: payload.notification?.icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: notificationId || Date.now().toString(),
                sound: soundFile
              })
            }
            
            // Show toast notification
            toast.success(payload.notification?.title || 'New notification', {
              duration: 5000
            })
            
            // Reload notifications (without playing sound again - already marked as seen)
            loadNotifications(false)
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

  // Refresh notifications when window regains focus (e.g., after accepting/rejecting from appointments page)
  useEffect(() => {
    const handleFocus = () => {
      if (showDropdown) {
        loadNotifications(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [showDropdown])

  const loadNotifications = async (playSoundOnNew = false) => {
    try {
      setLoading(true)
      const response = await notificationService.getNotifications(20, false)
      
      // Handle different response structures
      let notifications = []
      let newUnreadCount = 0
      
      if (Array.isArray(response)) {
        notifications = response
        newUnreadCount = response.filter(n => !n.isRead).length
      } else if (response?.data && Array.isArray(response.data)) {
        notifications = response.data
        newUnreadCount = response.unreadCount || 0
      } else if (response?.success && Array.isArray(response.data)) {
        notifications = response.data
        newUnreadCount = response.unreadCount || 0
      }
      
      // Only play sound if there are truly NEW notifications we haven't seen
      if (playSoundOnNew && notifications.length > 0) {
        // Get current notification IDs
        const currentNotificationIds = new Set(notifications.map(n => n._id || n.id).filter(Boolean))
        
        // Find NEW notifications (ones we haven't seen before and are unread)
        const newNotifications = notifications.filter(n => {
          const id = n._id || n.id
          return id && !seenNotificationIds.has(id) && !n.isRead
        })
        
        // If there are new unread notifications, play sound ONCE and show animated notifications
        if (newNotifications.length > 0) {
          console.log('🔔 New notifications detected! Playing sound once.')
          playNotificationSound()
          
          // Convert new notifications to animated format
          const animated = newNotifications.map(notif => mapNotificationToAnimated(notif, user))
          setAnimatedNotifications(prev => [...prev, ...animated].slice(-3)) // Keep max 3
          
          // Update seen notifications to include all current ones
          setSeenNotificationIds(currentNotificationIds)
        }
      } else if (!playSoundOnNew) {
        // On initial load, just track the IDs without playing sound
        const currentNotificationIds = new Set(notifications.map(n => n._id || n.id).filter(Boolean))
        setSeenNotificationIds(currentNotificationIds)
      }
      
      setNotifications(notifications)
      setUnreadCount(newUnreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
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

  // Helper function to get appointment status from notification
  const getAppointmentStatus = (notification) => {
    if (!notification.relatedAppointment) return null
    if (typeof notification.relatedAppointment === 'string') return null
    return notification.relatedAppointment.status || null
  }

  // Helper function to extract appointment ID from notification
  const extractAppointmentId = (notification) => {
    if (!notification.relatedAppointment) return null
    if (typeof notification.relatedAppointment === 'string') {
      return notification.relatedAppointment
    }
    if (notification.relatedAppointment._id) {
      return typeof notification.relatedAppointment._id === 'string' 
        ? notification.relatedAppointment._id 
        : notification.relatedAppointment._id.toString()
    }
    return null
  }

  const handleAcceptAppointment = async (appointmentId, e) => {
    e.stopPropagation()
    setProcessingAppointment(appointmentId)
    try {
      await appointmentManagementService.acceptAppointment(appointmentId)
      // Mark related notifications as read
      try {
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('Appointment accepted!')
      // Reload notifications to show updated status
      await loadNotifications()
    } catch (error) {
      toast.error(error.message || 'Failed to accept appointment')
      console.error('Error accepting appointment:', error)
    } finally {
      setProcessingAppointment(null)
    }
  }

  const handleRejectAppointment = async (appointmentId, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to reject this appointment?')) return
    
    setProcessingAppointment(appointmentId)
    try {
      await appointmentManagementService.rejectAppointment(appointmentId, 'Not available')
      // Mark related notifications as read
      try {
        await notificationService.markNotificationsReadByAppointment(appointmentId)
      } catch (markError) {
        console.log('Could not mark notifications as read:', markError)
      }
      toast.success('Appointment rejected')
      // Reload notifications to show updated status
      await loadNotifications()
    } catch (error) {
      toast.error(error.message || 'Failed to reject appointment')
      console.error('Error rejecting appointment:', error)
    } finally {
      setProcessingAppointment(null)
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

  const handleAnimatedNotificationClick = (notification) => {
    // Find the original notification
    const originalNotif = notifications.find(n => 
      (n._id || n.id) === notification.id
    )
    
    if (originalNotif) {
      // Handle notification click (same as dropdown)
      handleNotificationClick(originalNotif)
    }
  }

  const handleAnimatedNotificationDismiss = (notification) => {
    // Remove from animated notifications
    setAnimatedNotifications(prev => prev.filter(n => n.id !== notification.id))
    
    // Optionally mark as read
    const originalNotif = notifications.find(n => 
      (n._id || n.id) === notification.id
    )
    if (originalNotif && !originalNotif.isRead) {
      handleMarkAsRead(originalNotif._id || originalNotif.id)
    }
  }

  return (
    <>
      {/* Animated Notifications */}
      {animatedNotifications.length > 0 && (
        <AnimatedNotification
          notifications={animatedNotifications}
          position="top-right"
          maxNotifications={3}
          autoDismissTimeout={5000}
          variant="glass"
          showAvatars={true}
          showTimestamps={true}
          allowDismiss={true}
          onNotificationClick={handleAnimatedNotificationClick}
          onNotificationDismiss={handleAnimatedNotificationDismiss}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
      <button
        onClick={async () => {
          const newState = !showDropdown
          setShowDropdown(newState)
          // Reload notifications when opening dropdown to get latest appointment status
          if (newState) {
            await loadNotifications(false)
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
                      
                      {/* Accept/Reject buttons or status indicator for new appointment notifications */}
                      {notification.type === 'new_appointment' && 
                       notification.relatedAppointment && 
                       (isWorker || isOwner) && (
                        <div className="mt-3">
                          {(() => {
                            const appointmentStatus = getAppointmentStatus(notification)
                            const appointmentId = extractAppointmentId(notification)
                            const isProcessing = processingAppointment === appointmentId
                            
                            // Show status indicator if appointment is already accepted/rejected
                            if (appointmentStatus === 'Confirmed') {
                              return (
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                                  <CheckCircle size={16} className="text-green-600" />
                                  <span className="text-sm font-medium text-green-700">Accepted</span>
                                </div>
                              )
                            }
                            
                            if (appointmentStatus === 'Cancelled') {
                              return (
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                                  <XCircle size={16} className="text-red-600" />
                                  <span className="text-sm font-medium text-red-700">Rejected</span>
                                </div>
                              )
                            }
                            
                            // Show buttons if still pending
                            if (appointmentStatus === 'Pending' || !appointmentStatus) {
                              return (
                                <div className="flex gap-2">
                                  <button
                                    onClick={(e) => {
                                      if (appointmentId) {
                                        handleAcceptAppointment(appointmentId, e)
                                      } else {
                                        console.error('Could not extract appointment ID from notification:', notification)
                                        toast.error('Invalid appointment ID')
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                  >
                                    <CheckCircle size={14} />
                                    {isProcessing ? 'Processing...' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      if (appointmentId) {
                                        handleRejectAppointment(appointmentId, e)
                                      } else {
                                        console.error('Could not extract appointment ID from notification:', notification)
                                        toast.error('Invalid appointment ID')
                                      }
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                  >
                                    <XCircle size={14} />
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                  </button>
                                </div>
                              )
                            }
                            
                            return null
                          })()}
                        </div>
                      )}
                      
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
    </>
  )
}

export default NotificationBell




