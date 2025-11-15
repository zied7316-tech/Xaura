import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { QrCode, CheckCircle, XCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('form') // form, success, error
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Reset token is missing')
    }
  }, [token])

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Reset token is missing')
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      setStatus('success')
      setMessage('Password reset successfully!')
      toast.success('Password reset successfully!')
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Failed to reset password')
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to login page...</p>
            <Button onClick={() => navigate('/login')} fullWidth>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/forgot-password')} fullWidth>
                Request New Reset Link
              </Button>
              <Link to="/login" className="block text-sm text-primary-600 hover:text-primary-700">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <QrCode className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 mt-2">Enter your new password</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                error={errors.password?.message}
                icon={<Lock size={20} />}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm new password"
                error={errors.confirmPassword?.message}
                icon={<Lock size={20} />}
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => 
                    value === password || 'Passwords do not match'
                })}
              />
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
              <strong>Password Requirements:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>At least 6 characters long</li>
                <li>Use a combination of letters and numbers for better security</li>
              </ul>
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Reset Password
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Back to Login
            </Link>
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

export default ResetPasswordPage


