import { Menu, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import WorkerStatusToggle from './WorkerStatusToggle'
import NotificationBell from '../notifications/NotificationBell'
import SalonSwitcher from '../owner/SalonSwitcher'
import LanguageSwitcher from './LanguageSwitcher'

const Navbar = ({ onMenuClick }) => {
  const { user, logout, isWorker, isOwner } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
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
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="lg:pl-64">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>

          {/* Logo (mobile only) */}
          <div className="lg:hidden font-bold text-primary-600">Xaura</div>

          <div className="flex-1"></div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Owner Salon Switcher */}
            {isOwner && <SalonSwitcher />}
            
            {/* Worker Status Toggle */}
            {isWorker && <WorkerStatusToggle />}
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Notifications */}
            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={18} className="text-primary-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.role}</div>
                </div>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border">
                  <button
                    onClick={() => {
                      navigate('/profile')
                      setShowDropdown(false)
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User size={16} />
                    Profile
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
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

