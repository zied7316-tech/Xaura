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
      toast.success('Registration successful!')
      return { success: true, user: data.user }
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
        setSalon(salonData.salon)
        localStorage.setItem('salon', JSON.stringify(salonData.salon))
      } catch (error) {
        console.log('Failed to refresh salon data:', error)
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

