import { Menu, User, LogOut, Globe } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import WorkerStatusToggle from './WorkerStatusToggle'
import NotificationBell from '../notifications/NotificationBell'
import SalonSwitcher from '../owner/SalonSwitcher'
import LanguageSwitcher from './LanguageSwitcher'
import { useLanguage } from '../../context/LanguageContext'

const Navbar = ({ onMenuClick }) => {
  const { user, logout, isWorker, isOwner } = useAuth()
  const navigate = useNavigate()
  const { language, changeLanguage } = useLanguage()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const dropdownRef = useRef(null)
  const languageRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
      <div className="lg:pl-64">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button - Bigger touch target */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-3 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>

          {/* Logo (mobile only) - Bigger and clearer */}
          <div className="lg:hidden font-bold text-xl text-primary-600">Xaura</div>

          <div className="flex-1"></div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Owner Salon Switcher - Hidden on very small mobile, show on tablet+ */}
            {isOwner && <div className="hidden sm:block"><SalonSwitcher /></div>}
            
            {/* Worker Status Toggle - Visible on all devices */}
            {isWorker && <div className="block"><WorkerStatusToggle /></div>}
            
            {/* Language Switcher - Desktop only */}
            <div className="hidden sm:block"><LanguageSwitcher /></div>
            
            {/* Mobile Language Switcher - In user menu */}
            <div className="sm:hidden relative" ref={languageRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Change Language"
              >
                <Globe size={20} />
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200 z-50">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Language / Langue
                  </div>
                  <button
                    onClick={() => {
                      changeLanguage('en')
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${
                      language === 'en' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">🇬🇧</span>
                    <span>English</span>
                    {language === 'en' && <span className="ml-auto text-primary-600">✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('fr')
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left ${
                      language === 'fr' ? 'bg-primary-50 text-primary-600' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">🇫🇷</span>
                    <span>Français</span>
                    {language === 'fr' && <span className="ml-auto text-primary-600">✓</span>}
                  </button>
                </div>
              )}
            </div>
            
            {/* Notifications - Always visible but compact */}
            <NotificationBell />

            {/* User menu - Better mobile touch target */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px]"
                aria-label="User menu"
              >
                <div className="w-9 h-9 sm:w-8 sm:h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-primary-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-lg shadow-xl py-2 border border-gray-200">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowDropdown(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 sm:py-2 text-base sm:text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[48px] sm:min-h-[40px]"
                  >
                    <User size={20} className="sm:w-4 sm:h-4" />
                    <span className="font-medium">Profile</span>
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 sm:py-2 text-base sm:text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[48px] sm:min-h-[40px]"
                  >
                    <LogOut size={20} className="sm:w-4 sm:h-4" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

