import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useForm } from 'react-hook-form'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { CheckCircle } from 'lucide-react'
import Logo from '../../components/ui/Logo'
import { USER_ROLES } from '../../utils/constants'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../../components/layout/LanguageSwitcher'
import { useLanguage } from '../../context/LanguageContext'
import CongratulationsModal from '../../components/ui/CongratulationsModal'

const RegisterPage = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [redirectCountdown, setRedirectCountdown] = useState(5)
  const [showCongratulations, setShowCongratulations] = useState(false)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      role: 'Client'
    }
  })

  const selectedRole = watch('role')

  const roleOptions = [
    { value: USER_ROLES.CLIENT, label: t('auth.client', 'Client') },
    { value: USER_ROLES.WORKER, label: t('auth.worker', 'Worker') },
    { value: USER_ROLES.OWNER, label: t('auth.owner', 'Owner') },
  ]

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await registerUser(data)
      setLoading(false)

      if (result.success) {
        setUserEmail(data.email)
        setEmailError(result.emailError || null)
        
        // Show congratulations modal
        setShowCongratulations(true)
        
        // Countdown timer before redirect
        let countdown = 5
        setRedirectCountdown(countdown)
        const countdownInterval = setInterval(() => {
          countdown--
          setRedirectCountdown(countdown)
          if (countdown <= 0) {
            clearInterval(countdownInterval)
            setShowCongratulations(false)
            navigate('/login?registered=true&email=' + encodeURIComponent(data.email))
          }
        }, 1000)
      }
    } catch (error) {
      setLoading(false)
      // Error is already handled by AuthContext
    }
  }

  const handleResendVerification = async () => {
    if (!userEmail) return
    
    setLoading(true)
    try {
      const { authService } = await import('../../services/authService')
      const result = await authService.resendVerification(userEmail)
      
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error(result.message || 'Failed to resend verification email')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" showText={true} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('auth.createAccount', 'Create Account')}</h1>
          <p className="text-gray-600 mt-2">{t('auth.joinXaura', 'Join Xaura today')}</p>
        </div>

        {/* Congratulations Modal */}
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => {
            setShowCongratulations(false)
            navigate('/login?registered=true&email=' + encodeURIComponent(userEmail))
          }}
          title="🎉 Congratulations!"
          message={emailError ? "Your account has been created!" : "Your account has been created successfully!"}
          subtitle={emailError 
            ? "⚠️ Verification email could not be sent. Please use the resend option on the login page."
            : `We've sent a verification email to ${userEmail}. Please check your email to verify your account.`
          }
          countdown={redirectCountdown}
          onCountdownComplete={() => {
            setShowCongratulations(false)
            navigate('/login?registered=true&email=' + encodeURIComponent(userEmail))
          }}
          showCloseButton={true}
        />

        {/* Register Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Select
              label={t('auth.iam', 'I am a...')}
              options={roleOptions}
              error={errors.role?.message}
              {...register('role', { required: 'Please select your role' })}
            />

            <Input
              label={t('auth.fullName', 'Full Name')}
              type="text"
              placeholder={t('auth.fullNamePlaceholder', 'Enter your full name')}
              error={errors.name?.message}
              {...register('name', { 
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
            />

            <Input
              label={t('common.email', 'Email')}
              type="email"
              placeholder={t('auth.emailPlaceholder', 'Enter your email')}
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
              label={t('auth.phoneWhatsApp', 'Phone Number (WhatsApp)')}
              type="tel"
              placeholder={t('auth.phonePlaceholder', '12345678')}
              error={errors.phone?.message}
              {...register('phone', { 
                required: 'WhatsApp phone number is required',
                pattern: {
                  value: /^[0-9]{8}$/,
                  message: 'Please enter your 8-digit Tunisian phone number (e.g., 12345678). The system will automatically add +216.'
                }
              })}
            />
            <p className="text-xs text-blue-600 -mt-2 mb-2">
              {t('auth.phoneExplanation', '💬 Enter your 8-digit Tunisian phone number. We\'ll automatically add the country code (+216). This number will be used for WhatsApp notifications about your appointments.')}
            </p>

            <div>
              <Input
                label={t('auth.birthday', 'Birthday (Optional)')}
                type="date"
                error={errors.birthday?.message}
                {...register('birthday', { 
                  required: false,
                  validate: {
                    notFuture: (value) => {
                      if (!value) return true
                      const selectedDate = new Date(value)
                      const today = new Date()
                      return selectedDate <= today || 'Birthday cannot be in the future'
                    },
                    validAge: (value) => {
                      if (!value) return true
                      const selectedDate = new Date(value)
                      const today = new Date()
                      const age = today.getFullYear() - selectedDate.getFullYear()
                      const monthDiff = today.getMonth() - selectedDate.getMonth()
                      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate()) ? age - 1 : age
                      return actualAge >= 13 || 'You must be at least 13 years old'
                    }
                  }
                })}
              />
              <p className="text-xs text-purple-600 mt-1">
                {t('auth.birthdayExplanation', 'Optional: Share your birthday to receive special gifts and discounts from salons on your special day!')}
              </p>
            </div>

            <Input
              label={t('auth.password', 'Password')}
              type="password"
              placeholder={t('auth.passwordPlaceholderCreate', 'Create a password')}
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />

            {selectedRole === USER_ROLES.OWNER && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
                <strong>{t('auth.salonOwnersNote', 'Salon Owners: After registration, you\'ll be able to create your salon profile and start managing your business.')}</strong>
              </div>
            )}

            {selectedRole === USER_ROLES.WORKER && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <strong>Workers:</strong> After registration, ask your salon owner to add you to their salon team.
              </div>
            )}

            <div className="flex items-start">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1" 
                {...register('terms', { required: 'You must accept the terms' })}
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600 -mt-2">{errors.terms.message}</p>
            )}

            <Button type="submit" fullWidth loading={loading}>
              {t('auth.createAccount', 'Create Account')}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.haveAccount', 'Already have an account?')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.signIn', 'Sign in')}
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

export default RegisterPage

