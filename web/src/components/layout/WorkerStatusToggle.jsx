import { useState, useEffect, useRef } from 'react'
import { workerStatusService } from '../../services/workerStatusService'
import { workerTrackingService } from '../../services/workerTrackingService'
import { CheckCircle, Coffee, XCircle, ChevronDown, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const WorkerStatusToggle = () => {
  const [currentStatus, setCurrentStatus] = useState('available')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false)
  const locationIntervalRef = useRef(null)
  const gpsWarningLockRef = useRef(false)
  const gpsWarningTimeoutRef = useRef(null)
  const gpsPermissionStatusRef = useRef(null)
  const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  }

  const showGPSWarning = () => {
    if (gpsWarningLockRef.current) {
      return
    }
    gpsWarningLockRef.current = true
    toast.error('GPS tracking is disabled. Please enable location services and approve access so your status stays accurate.')
    gpsWarningTimeoutRef.current = setTimeout(() => {
      gpsWarningLockRef.current = false
      gpsWarningTimeoutRef.current = null
    }, 8000)
  }

  const ensureGPSPermission = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return false
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: 'geolocation' })
        gpsPermissionStatusRef.current = status
        if (!status.onchange) {
          status.onchange = () => {
            if (status.state === 'denied') {
              showGPSWarning()
            }
          }
        }

        if (status.state === 'granted') {
          return true
        }

        if (status.state === 'prompt') {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => {
                showGPSWarning()
                resolve(false)
              },
              geolocationOptions
            )
          })
        }

        if (status.state === 'denied') {
          showGPSWarning()
          return false
        }
      }

      return true
    } catch (error) {
      console.error('[TRACKING] Permission check failed:', error)
      return true
    }
  }

  useEffect(() => {
    loadStatus()
    checkTrackingSettings()
    
    // Periodically check tracking settings (every 30 seconds)
    const trackingInterval = setInterval(() => {
      checkTrackingSettings()
    }, 30000)
    
    // Check on window focus (when user comes back to tab)
    const handleFocus = () => {
      checkTrackingSettings()
      loadStatus()
    }
    window.addEventListener('focus', handleFocus)
    
    // Auto-report location if tracking is enabled (every 60 seconds)
    const startLocationReporting = async () => {
      try {
        const response = await workerTrackingService.getMySalonSettings()
        const trackingEnabled = response?.data?.isTrackingEnabled || response?.isTrackingEnabled || false
        const method = response?.data?.method || response?.method || 'manual'
        
        console.log('[WORKER STATUS] Starting location reporting - enabled:', trackingEnabled, 'method:', method)
        
        const hasPermission = await ensureGPSPermission()
        if (!hasPermission) {
          return
        }

        if (trackingEnabled && method === 'gps') {
          // Helper function to report GPS error to backend
          const reportGPSError = async (error) => {
            console.log('[TRACKING] GPS error:', error.message, 'Code:', error.code)
            try {
              // Report null coordinates to indicate GPS unavailable
              await workerTrackingService.reportLocation({
                latitude: null,
                longitude: null,
                gpsUnavailable: true,
                errorCode: error.code // 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
              })
              showGPSWarning()
              loadStatus() // Reload status after reporting error
            } catch (reportError) {
              console.error('[TRACKING] Error reporting GPS error to backend:', reportError)
            }
          }
          
          // Report immediately on first check
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                try {
                  await workerTrackingService.reportLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                  })
                  loadStatus()
                } catch (error) {
                  console.error('[TRACKING] Error reporting location:', error)
                }
              },
              async (error) => {
                // Report GPS error immediately to backend
                await reportGPSError(error)
              },
              geolocationOptions
            )
          } else {
            // Geolocation not supported - report as unavailable
            console.log('[TRACKING] Geolocation not supported by browser')
            await reportGPSError({ code: 2, message: 'Geolocation not supported' })
          }
          
          // Then set up interval for periodic reporting
          locationIntervalRef.current = setInterval(() => {
            ensureGPSPermission().then((hasPermission) => {
              if (!hasPermission) {
                reportGPSError({ code: 1, message: 'GPS permission denied' })
                return
              }

              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  async (position) => {
                    try {
                      await workerTrackingService.reportLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                      })
                      loadStatus()
                    } catch (error) {
                      console.error('[TRACKING] Error reporting location:', error)
                    }
                  },
                  async (error) => {
                    // Report GPS error to backend so status can be updated
                    await reportGPSError(error)
                  },
                  geolocationOptions
                )
              } else {
                // Geolocation not supported
                reportGPSError({ code: 2, message: 'Geolocation not supported' })
              }
            })
          }, 30000) // Report every 30 seconds (reduced from 60 for faster detection)
        }
      } catch (error) {
        console.error('[WORKER STATUS] Error starting location reporting:', error)
      }
    }
    
    // Start location reporting after initial check
    checkTrackingSettings().then(() => {
      startLocationReporting()
    })
    
    return () => {
      clearInterval(trackingInterval)
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
        locationIntervalRef.current = null
      }
      if (gpsWarningTimeoutRef.current) {
        clearTimeout(gpsWarningTimeoutRef.current)
        gpsWarningTimeoutRef.current = null
      }
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadStatus = async () => {
    try {
      const data = await workerStatusService.getMyStatus()
      setCurrentStatus(data.currentStatus || 'offline')
    } catch (error) {
      console.error('Error loading status:', error)
    }
  }

  const checkTrackingSettings = async () => {
    try {
      const response = await workerTrackingService.getMySalonSettings()
      console.log('[WORKER STATUS] Tracking settings response:', response)
      
      // Handle different response structures
      let isEnabled = false
      if (response && response.data) {
        isEnabled = response.data.isTrackingEnabled || false
      } else if (response && response.isTrackingEnabled !== undefined) {
        isEnabled = response.isTrackingEnabled
      } else if (response && response.method) {
        isEnabled = response.method !== 'manual'
      }
      
      console.log('[WORKER STATUS] Tracking enabled:', isEnabled)
      setIsTrackingEnabled(isEnabled)
    } catch (error) {
      console.error('[WORKER STATUS] Error checking tracking settings:', error)
      // If error, assume manual mode (allow status changes)
      setIsTrackingEnabled(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (isTrackingEnabled) {
      toast.error('Status is automatically managed by WiFi/GPS tracking')
      return
    }

    setLoading(true)
    try {
      await workerStatusService.toggleStatus(newStatus)
      setCurrentStatus(newStatus)
      setShowDropdown(false)
      
      const messages = {
        available: '✅ You are now Available for appointments',
        on_break: '☕ Status set to On Break',
        offline: '🔴 You are now Offline'
      }
      toast.success(messages[newStatus])
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    available: {
      label: 'Available',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      hoverBg: 'hover:bg-green-200',
      borderColor: 'border-green-300'
    },
    on_break: {
      label: 'On Break',
      icon: Coffee,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      hoverBg: 'hover:bg-orange-200',
      borderColor: 'border-orange-300'
    },
    offline: {
      label: 'Offline',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      hoverBg: 'hover:bg-red-200',
      borderColor: 'border-red-300'
    }
  }

  const current = statusConfig[currentStatus]
  const CurrentIcon = current.icon

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isTrackingEnabled) {
            toast.info('Status is automatically managed by WiFi/GPS tracking. Connect to salon WiFi or be at salon location to show as Available.')
            return
          }
          setShowDropdown(!showDropdown)
        }}
        disabled={loading || isTrackingEnabled}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 transition-all ${current.bgColor} ${current.borderColor} ${isTrackingEnabled ? '' : current.hoverBg} ${loading || isTrackingEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isTrackingEnabled ? 'Status is automatically managed by WiFi/GPS tracking' : 'Change status'}
      >
        {isTrackingEnabled && <Lock size={14} className={`${current.color} sm:w-3 sm:h-3`} />}
        <CurrentIcon size={16} className={`${current.color} sm:w-[18px] sm:h-[18px]`} />
        <span className={`font-medium text-xs sm:text-sm ${current.color}`}>
          {current.label}
        </span>
        {!isTrackingEnabled && <ChevronDown size={14} className={`${current.color} sm:w-4 sm:h-4`} />}
      </button>

      {showDropdown && !isTrackingEnabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Change Status</p>
            </div>
            
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon
              const isActive = status === currentStatus
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={loading || isActive}
                  className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 transition-colors min-h-[48px] sm:min-h-[40px] ${
                    isActive 
                      ? `${config.bgColor} cursor-default`
                      : 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer'
                  } ${loading ? 'opacity-50' : ''}`}
                >
                  <Icon size={18} className={config.color} />
                  <span className={`font-medium text-sm ${config.color}`}>
                    {config.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-sm text-gray-500">✓</span>
                  )}
                </button>
              )
            })}

            <div className="px-3 py-2 border-t border-gray-100 mt-2">
              <p className="text-xs text-gray-500">
                ℹ️ Your status affects booking availability
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WorkerStatusToggle

