import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'

const Logo = ({ 
  size = 'md', 
  showText = true, 
  className = '',
  linkTo = '/'
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="Xaura Logo"
        className={`${sizeClasses[size]} object-contain`}
        onError={(e) => {
          // Fallback to QrCode icon if logo image not found
          e.target.style.display = 'none'
          const fallback = e.target.nextElementSibling
          if (fallback) {
            fallback.style.display = 'flex'
            fallback.className = `${sizeClasses[size]} text-primary-600`
          }
        }}
      />
      {/* Fallback icon - hidden by default */}
      <div style={{ display: 'none' }}>
        <QrCode className="text-primary-600" size={size === 'sm' ? 20 : size === 'md' ? 24 : size === 'lg' ? 28 : 32} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]} bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 bg-clip-text text-transparent`}>
          XAURA
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}

export default Logo

