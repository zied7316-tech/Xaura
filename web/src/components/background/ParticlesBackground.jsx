import { useLayoutEffect } from 'react'

const ParticlesBackground = ({
  colors = ['#667eea', '#764ba2', '#f093fb'],
  size = 3,
  countDesktop = 60,
  countTablet = 50,
  countMobile = 40,
  zIndex = 0,
  height = '100vh',
}) => {
  useLayoutEffect(() => {
    // Check if particles.js is already loaded
    if (window.particlesJS) {
      initializeParticles()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js'
    script.async = true
    
    script.onload = () => {
      initializeParticles()
    }

    script.onerror = () => {
      console.error('Failed to load particles.js')
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup: remove script if component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [colors, size, countDesktop, countTablet, countMobile])

  const initializeParticles = () => {
    const particlesElement = document.getElementById('js-particles')
    
    if (!particlesElement || !window.particlesJS) {
      return
    }

    const getParticleCount = () => {
      const screenWidth = window.innerWidth
      if (screenWidth > 1024) return countDesktop
      if (screenWidth > 768) return countTablet
      return countMobile
    }

    window.particlesJS('js-particles', {
      particles: {
        number: {
          value: getParticleCount(),
        },
        color: {
          value: colors,
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.5,
          random: true,
        },
        size: {
          value: size,
          random: true,
        },
        line_linked: {
          enable: false,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: true,
          straight: false,
          out_mode: 'out',
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: false,
          },
          onclick: {
            enable: false,
          },
          resize: true,
        },
      },
      retina_detect: true,
    })
  }

  return (
    <div
      id="js-particles"
      style={{
        width: '100%',
        height: height,
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: zIndex,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        #js-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        #js-particles canvas {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .particles-js-canvas-el {
          position: absolute;
        }
      `}</style>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  )
}

export default ParticlesBackground

