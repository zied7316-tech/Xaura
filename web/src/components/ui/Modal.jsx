import { X } from 'lucide-react'
import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, children, size = 'md', showHeader = true, className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-lg shadow-2xl w-full ${sizes[size]} transform transition-all ${className}`}>
          {/* Header - only show if title is provided or showHeader is true */}
          {(title || showHeader) && (
            <div className="flex items-center justify-between p-4 border-b">
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {!title && <div></div>}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className={showHeader && title ? 'p-6' : ''}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Modal

