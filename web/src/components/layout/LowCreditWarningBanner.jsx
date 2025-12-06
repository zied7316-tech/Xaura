import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { subscriptionService } from '../../services/subscriptionService'
import { AlertCircle, X, MessageSquare } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const LowCreditWarningBanner = ({ onVisibilityChange }) => {
  const { isOwner } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!isOwner) {
      setLoading(false)
      if (onVisibilityChange) onVisibilityChange(false)
      return
    }

    loadSubscription()
    
    // Refresh subscription data every 30 seconds to check credit status
    const interval = setInterval(() => {
      loadSubscription()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isOwner, onVisibilityChange])
  
  useEffect(() => {
    if (!loading && isOwner && !dismissed) {
      const whatsappCredits = subscription?.addOns?.whatsappCredits?.balance || 0
      const smsCredits = subscription?.addOns?.smsCredits?.balance || 0
      const credits = whatsappCredits || smsCredits || 0
      const shouldShowWarning = credits <= 10
      
      if (onVisibilityChange) {
        onVisibilityChange(shouldShowWarning)
      }
    } else {
      if (onVisibilityChange) onVisibilityChange(false)
    }
  }, [loading, isOwner, dismissed, subscription, onVisibilityChange])

  const loadSubscription = async () => {
    try {
      const response = await subscriptionService.getMySubscription()
      setSubscription(response.data)
    } catch (error) {
      console.error('Error loading subscription for credit warning:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOwner || loading || dismissed) {
    return null
  }

  // Get WhatsApp credits balance
  const whatsappCredits = subscription?.addOns?.whatsappCredits?.balance || 0
  const smsCredits = subscription?.addOns?.smsCredits?.balance || 0 // Fallback for backward compatibility
  const credits = whatsappCredits || smsCredits || 0

  // Show warning if credits are 0 or less than 10
  const shouldShowWarning = credits <= 10

  if (!shouldShowWarning) {
    return null
  }

  const isZero = credits === 0

  return (
    <div className={`credit-warning-banner fixed top-16 left-0 right-0 z-40 ${
      isZero 
        ? 'bg-red-600' 
        : 'bg-orange-500'
    } text-white shadow-lg`}>
      <div className="lg:pl-64">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <AlertCircle className="flex-shrink-0" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">
                {isZero 
                  ? '⚠️ WhatsApp Credits Épuisés!'
                  : `⚠️ WhatsApp Credits Faibles: ${credits} crédits restants`
                }
              </p>
              <p className="text-xs sm:text-sm opacity-90 mt-1">
                {isZero
                  ? 'Vous ne pouvez plus envoyer de messages WhatsApp. Veuillez acheter des crédits pour continuer.'
                  : 'Vos crédits WhatsApp sont presque épuisés. Achetez plus de crédits pour éviter les interruptions.'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            <button
              onClick={() => navigate('/owner/subscription')}
              className="px-4 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base whitespace-nowrap"
            >
              <MessageSquare size={16} className="inline mr-2" />
              Acheter des Crédits
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LowCreditWarningBanner

