import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import Button from '../../components/ui/Button'
import { CheckCircle, XCircle, Mail } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import toast from 'react-hot-toast'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage('Verification token is missing')
    }
  }, [searchParams])

  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token)
      setStatus('success')
      setMessage(response.message || 'Email verified successfully!')
      toast.success('Email verified successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Failed to verify email')
      toast.error(error.message || 'Failed to verify email')
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setResending(true)
    try {
      await authService.resendVerification(email)
      toast.success('Verification email sent! Please check your inbox.')
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Email Verification</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                <Mail className="text-primary-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your email...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-4">Redirecting to login page...</p>
              <Button onClick={() => navigate('/login')} fullWidth>
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <XCircle className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resend verification email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <Button 
                  onClick={handleResendVerification} 
                  fullWidth 
                  loading={resending}
                  disabled={!email}
                >
                  Resend Verification Email
                </Button>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Login
            </Link>
            <span className="text-gray-300 mx-2">•</span>
            <Link to="/register" className="text-sm text-primary-600 hover:text-primary-700">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage


