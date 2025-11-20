import { createContext, useState, useContext, useEffect } from 'react'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [salon, setSalon] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = authService.getStoredUser()
        const storedSalon = localStorage.getItem('salon')
        const token = authService.getToken()

        if (storedUser && token) {
          // Verify token is still valid
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          
          // Load salon data if user is Owner
          if (currentUser.role === 'Owner') {
            try {
              const { salonAccountService } = await import('../services/salonAccountService')
              const salonData = await salonAccountService.getSalonAccount()
              
              // Preserve logo from stored salon if new data doesn't have it or is empty
              const parsedStoredSalon = storedSalon ? JSON.parse(storedSalon) : null
              const storedLogo = parsedStoredSalon?.logo
              const apiLogo = salonData.salon?.logo
              
              // Check if stored logo is valid (not empty string, null, or undefined)
              const hasValidStoredLogo = storedLogo && storedLogo.trim() !== ''
              // Check if API logo is empty or missing
              const apiLogoIsEmpty = !apiLogo || apiLogo.trim() === ''
              
              if (hasValidStoredLogo && apiLogoIsEmpty) {
                console.warn('Logo missing/empty in API response, preserving from localStorage:', storedLogo)
                salonData.salon.logo = storedLogo
              }
              
              console.log('Initial salon load - Logo:', salonData.salon?.logo)
              setSalon(salonData.salon)
              localStorage.setItem('salon', JSON.stringify(salonData.salon))
            } catch (error) {
              console.log('No salon found for owner')
              if (storedSalon) {
                setSalon(JSON.parse(storedSalon))
              }
            }
          } else if (storedSalon) {
            setSalon(JSON.parse(storedSalon))
          }
        }
      } catch (error) {
        // Token is invalid, clear auth
        authService.logout()
        localStorage.removeItem('salon')
        setUser(null)
        setSalon(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // Initialize push notifications after login
  useEffect(() => {
    if (user) {
      // Initialize push notifications in background
      const initPushNotifications = async () => {
        try {
          const { pushNotificationService } = await import('../services/pushNotificationService')
          const { getNotificationPermission } = await import('../services/firebaseService')
          
          // Only initialize if permission is already granted
          const permission = getNotificationPermission()
          if (permission === 'granted') {
            const token = localStorage.getItem('fcm_token')
            if (!token) {
              // Try to get and register token
              await pushNotificationService.initialize()
            }
          }
        } catch (error) {
          console.log('Push notifications not available:', error)
        }
      }
      
      initPushNotifications()
    }
  }, [user])

  // Login function
  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)
      setUser(data.user)
      
      // Load salon data if user is Owner
      if (data.user.role === 'Owner') {
        try {
          const { salonAccountService } = await import('../services/salonAccountService')
          const salonData = await salonAccountService.getSalonAccount()
          
          // Preserve logo from localStorage if API returns empty
          const storedSalon = localStorage.getItem('salon')
          const parsedStoredSalon = storedSalon ? JSON.parse(storedSalon) : null
          const storedLogo = parsedStoredSalon?.logo
          const apiLogo = salonData.salon?.logo
          
          const hasValidStoredLogo = storedLogo && storedLogo.trim() !== ''
          const apiLogoIsEmpty = !apiLogo || apiLogo.trim() === ''
          
          if (hasValidStoredLogo && apiLogoIsEmpty) {
            console.warn('Login - Logo missing/empty in API, preserving from localStorage')
            salonData.salon.logo = storedLogo
          }
          
          console.log('Login - Salon logo from API:', salonData.salon?.logo)
          setSalon(salonData.salon)
          localStorage.setItem('salon', JSON.stringify(salonData.salon))
        } catch (error) {
          console.log('No salon found for owner')
        }
      }
      
      toast.success('Login successful!')
      return { success: true, user: data.user }
    } catch (error) {
      toast.error(error.message || 'Login failed')
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async (userData) => {
    try {
      const data = await authService.register(userData)
      setUser(data.user)
      // Don't show toast here - let the RegisterPage handle it based on email status
      return { 
        success: true, 
        user: data.user,
        emailSent: data.emailSent || false,
        emailError: data.emailError || null,
        message: data.message
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed')
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = () => {
    authService.logout()
    localStorage.removeItem('salon')
    setUser(null)
    setSalon(null)
    toast.success('Logged out successfully')
  }

  // Update user data
  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  // Refresh salon data
  const refreshSalon = async () => {
    if (user?.role === 'Owner') {
      try {
        const { salonAccountService } = await import('../services/salonAccountService')
        const salonData = await salonAccountService.getSalonAccount()
        
        // Preserve logo if it exists in current state or localStorage but not in new data
        const currentSalon = salon
        const storedSalon = localStorage.getItem('salon')
        const parsedStoredSalon = storedSalon ? JSON.parse(storedSalon) : null
        const newSalon = salonData.salon
        
        // Get logo from current state or localStorage (prioritize current state)
        const logoToPreserve = currentSalon?.logo || parsedStoredSalon?.logo
        
        // Check if we have a valid logo to preserve (not empty string, null, or undefined)
        const hasValidLogo = logoToPreserve && logoToPreserve.trim() !== ''
        
        // Check if new data has empty/invalid logo
        const newLogoIsEmpty = !newSalon?.logo || newSalon.logo.trim() === ''
        
        if (hasValidLogo && newLogoIsEmpty) {
          console.warn('Logo missing/empty in refreshed data, preserving from cache:', logoToPreserve)
          newSalon.logo = logoToPreserve
        }
        
        console.log('Refreshed salon data:', {
          logoFromAPI: newSalon?.logo,
          logoPreserved: hasValidLogo && newLogoIsEmpty ? logoToPreserve : null,
          finalLogo: newSalon?.logo
        })
        
        setSalon(newSalon)
        localStorage.setItem('salon', JSON.stringify(newSalon))
      } catch (error) {
        console.error('Failed to refresh salon data:', error)
      }
    }
  }

  const value = {
    user,
    salon,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshSalon,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'SuperAdmin' || user?.role === 'super-admin',
    isOwner: user?.role === 'Owner',
    isWorker: user?.role === 'Worker',
    isClient: user?.role === 'Client',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

