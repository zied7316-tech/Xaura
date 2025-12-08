import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, Star, PartyPopper } from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from './Button'

const CongratulationsModal = ({ 
  isOpen, 
  onClose, 
  title = "🎉 Congratulations!",
  message,
  subtitle,
  countdown,
  onCountdownComplete,
  showCloseButton = true
}) => {
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    if (isOpen) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)]
      }))
      setConfetti(particles)
    }
  }, [isOpen])

  // Sparkle particles
  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    size: 4 + Math.random() * 8
  }))

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Confetti Container */}
          <div className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden">
            {confetti.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  x: `${particle.x}vw`,
                  y: '-10vh',
                  rotate: 0,
                  opacity: 1,
                  scale: 0.8
                }}
                animate={{ 
                  y: '110vh',
                  rotate: 360,
                  opacity: [1, 1, 0],
                  scale: [0.8, 1, 0.5]
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: 'easeOut'
                }}
                className="absolute w-3 h-3 rounded-full"
                style={{ backgroundColor: particle.color }}
              />
            ))}
          </div>

          {/* Main Modal */}
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: 'spring',
                stiffness: 400,
                damping: 25,
                duration: 0.3
              }}
              className="relative bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-2xl shadow-2xl max-w-sm w-full p-6 pointer-events-auto border-2 border-purple-200"
            >
              {/* Sparkle Effects */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {sparkles.map((sparkle) => (
                  <motion.div
                    key={sparkle.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: sparkle.delay,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute"
                    style={{
                      left: `${sparkle.x}%`,
                      top: `${sparkle.y}%`,
                      width: `${sparkle.size}px`,
                      height: `${sparkle.size}px`
                    }}
                  >
                    <Star className="w-full h-full text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Animated Checkmark Icon (without green background) */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: 0.05
                  }}
                  className="inline-flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-12 h-12 text-purple-600" strokeWidth={2.5} />
                </motion.div>

                {/* Title with animation */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-2"
                >
                  {title}
                </motion.h2>

                {/* Message */}
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-base text-gray-700 mb-2 font-medium"
                  >
                    {message}
                  </motion.p>
                )}

                {/* Subtitle */}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-gray-600 mb-4"
                  >
                    {subtitle}
                  </motion.p>
                )}

                {/* Countdown */}
                {countdown !== undefined && countdown > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mb-4"
                  >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-full border-2 border-purple-300">
                      <PartyPopper className="text-purple-600" size={16} />
                      <span className="text-xs font-semibold text-purple-700">
                        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-col gap-2"
                >
                  {onCountdownComplete && (
                    <Button 
                      onClick={onCountdownComplete}
                      fullWidth
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg"
                    >
                      Continue Now
                    </Button>
                  )}
                  {showCloseButton && (
                    <Button 
                      onClick={onClose}
                      variant="outline"
                      fullWidth
                    >
                      Close
                    </Button>
                  )}
                </motion.div>
              </div>

              {/* Decorative elements */}
              <motion.div
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, rotate: 180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="absolute -bottom-3 -left-3 w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl"
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CongratulationsModal

