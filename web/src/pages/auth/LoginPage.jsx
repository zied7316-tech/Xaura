import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Logo from '../../components/ui/Logo'
import toast from 'react-hot-toast'
import CongratulationsModal from '../../components/ui/CongratulationsModal'

const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [congratulationsData, setCongratulationsData] = useState(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  // Check for registration success message
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const registered = searchParams.get('registered')
    const registeredEmail = searchParams.get('email')
    const registeredSalon = searchParams.get('salon')

    if (registered === 'true') {
      setCongratulationsData({
        salon: registeredSalon,
        email: registeredEmail
      })
      setShowCongratulations(true)
      // Clear URL params after showing message
      window.history.replaceState({}, '', '/login')
    }
  }, [location.search])

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await login(data)
    setLoading(false)

    if (result.success) {
      // Navigate based on user role
      const dashboardRoutes = {
        'SuperAdmin': '/super-admin/dashboard',
        'super-admin': '/super-admin/dashboard', // Support both formats
        'Owner': '/owner/dashboard',
        'Worker': '/worker/dashboard',
        'Client': '/client/dashboard'
      }
      navigate(dashboardRoutes[result.user.role] || '/client/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Congratulations Modal */}
      {congratulationsData && (
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => setShowCongratulations(false)}
          title="🎉 Congratulations!"
          message={congratulationsData.salon 
            ? `Your salon "${congratulationsData.salon}" has been created successfully!`
            : "Your account has been created successfully!"
          }
          subtitle={congratulationsData.salon
            ? "Please log in to start managing your salon business."
            : `Please check your email (${congratulationsData.email || ''}) to verify your account, then log in.`
          }
          showCloseButton={true}
        />
      )}

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your Xaura account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address'
                }
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

