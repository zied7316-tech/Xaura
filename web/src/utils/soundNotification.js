/**
 * Sound Notification Utility
 * Plays notification sounds for workers when they perform actions
 */

// Audio reference to maintain unlocked state
let audioRef = null
let audioUnlockedRef = false

/**
 * Unlock audio on first user interaction (required by browsers)
 */
const unlockAudio = async () => {
  if (audioUnlockedRef) return true
  
  try {
    const soundFile = '/sounds/worker-notification.mp3.mp3'
    const audio = new Audio(soundFile)
    audio.volume = 0.7
    audio.preload = 'auto'
    
    // Try to play and immediately pause to unlock
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      await playPromise
      audio.pause()
      audio.currentTime = 0
      audioRef = audio
      audioUnlockedRef = true
      console.log('🔊 Audio unlocked successfully')
      return true
    }
  } catch (error) {
    console.log('🔊 Audio unlock failed (will retry on next interaction):', error.message)
    return false
  }
  return false
}

/**
 * Play worker notification sound
 * This is called when worker adds walk-in or completes appointment
 */
export const playWorkerNotificationSound = async () => {
  try {
    const soundFile = '/sounds/worker-notification.mp3.mp3'
    
    // If audio is not unlocked, try to unlock it first
    if (!audioUnlockedRef) {
      const unlocked = await unlockAudio()
      if (!unlocked) {
        console.log('🔊 Audio not unlocked yet, sound will play on next user interaction')
        return
      }
    }
    
    // Use existing unlocked audio or create new one
    let audio = audioRef
    
    if (!audio || audio.ended || audio.error) {
      // Create new audio instance if needed
      audio = new Audio(soundFile)
      audio.volume = 0.7
      audio.preload = 'auto'
      audioRef = audio
    }
    
    // Reset to beginning if already played
    if (audio.currentTime > 0) {
      audio.currentTime = 0
    }
    
    // Play the sound
    const playPromise = audio.play()
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🔊 Worker notification sound playing successfully')
        })
        .catch((error) => {
          console.error('🔊 Error playing sound:', error)
          // If autoplay blocked, try to unlock on next interaction
          if (error.name === 'NotAllowedError') {
            audioUnlockedRef = false
            console.log('🔊 Audio needs to be unlocked. User interaction required.')
          }
        })
    }
  } catch (error) {
    console.error('🔊 Error creating audio:', error)
  }
}

/**
 * Initialize audio unlock on first user interaction
 * Call this once when the app loads
 */
export const initializeSoundNotification = () => {
  // Unlock audio on first user interaction
  const unlockOnInteraction = () => {
    unlockAudio().then(() => {
      // Remove listeners after successful unlock
      document.removeEventListener('click', unlockOnInteraction)
      document.removeEventListener('touchstart', unlockOnInteraction)
    })
  }
  
  // Try to unlock audio on any user interaction
  document.addEventListener('click', unlockOnInteraction, { once: true })
  document.addEventListener('touchstart', unlockOnInteraction, { once: true })
}

