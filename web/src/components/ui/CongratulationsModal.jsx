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
                stiffness: 300,
                damping: 30,
                duration: 0.6
              }}
              className="relative bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-3xl shadow-2xl max-w-md w-full p-8 pointer-events-auto border-2 border-purple-200"
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
                {/* Animated Checkmark Circle */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="inline-flex items-center justify-center w-24 h-24 mb-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-lg"
                  />
                  <motion.div
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="relative z-10"
                  >
                    <CheckCircle className="w-16 h-16 text-white" strokeWidth={3} />
                  </motion.div>
                  
                  {/* Pulsing rings */}
                  {[1, 2, 3].map((ring) => (
                    <motion.div
                      key={ring}
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ 
                        scale: [1, 1.5, 1.5],
                        opacity: [0.8, 0, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: 0.5 + ring * 0.2,
                        repeat: Infinity,
                        ease: 'easeOut'
                      }}
                      className="absolute inset-0 border-4 border-green-400 rounded-full"
                    />
                  ))}
                </motion.div>

                {/* Title with animation */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent mb-3"
                >
                  {title}
                </motion.h2>

                {/* Message */}
                {message && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-gray-700 mb-2 font-medium"
                  >
                    {message}
                  </motion.p>
                )}

                {/* Subtitle */}
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm text-gray-600 mb-6"
                  >
                    {subtitle}
                  </motion.p>
                )}

                {/* Countdown */}
                {countdown !== undefined && countdown > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 }}
                    className="mb-6"
                  >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full border-2 border-purple-300">
                      <PartyPopper className="text-purple-600" size={18} />
                      <span className="text-sm font-semibold text-purple-700">
                        Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex flex-col gap-3"
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
                transition={{ delay: 0.4, duration: 0.8 }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, rotate: 180 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl"
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CongratulationsModal

