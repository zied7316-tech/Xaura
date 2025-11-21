import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import {
  LayoutDashboard,
  Store,
  Calendar,
  MessageSquare,
  User,
  Users,
  DollarSign,
  Bell,
  TrendingUp,
  Clock
} from 'lucide-react'

/**
 * Mobile-only bottom navigation bar
 * Provides quick access to main features
 * Optimized for thumb reach
 */
const MobileBottomNav = () => {
  const { isSuperAdmin, isOwner, isWorker, isClient } = useAuth()
  const { t } = useLanguage()

  // Different nav items based on role
  const superAdminNav = [
    { to: '/super-admin/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/super-admin/salons', icon: Store, label: t('superAdmin.allSalons', 'Salons') },
    { to: '/super-admin/users', icon: Users, label: t('superAdmin.allUsers', 'Users') },
    { to: '/super-admin/analytics', icon: TrendingUp, label: t('superAdmin.growthAnalytics', 'Analytics') },
  ]

  const ownerNav = [
    { to: '/owner/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/owner/salons', icon: Store, label: t('owner.mySalons', 'Salons') },
    { to: '/appointments', icon: Calendar, label: t('owner.appointments', 'Appointments') },
    { to: '/owner/finances', icon: DollarSign, label: t('owner.finances', 'Finances') },
  ]

  const workerNav = [
    { to: '/worker/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/worker/availability', icon: Clock, label: t('worker.myAvailability', 'Availability') },
    { to: '/worker/appointments', icon: Calendar, label: t('worker.myAppointments', 'Appointments') },
    { to: '/messages', icon: MessageSquare, label: t('chat.messages', 'Messages') },
    { to: '/worker/finances', icon: DollarSign, label: t('worker.myFinances', 'Finances') },
  ]

  const clientNav = [
    { to: '/client/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/search-salons', icon: Store, label: t('client.findSalons', 'Find') },
    { to: '/appointments', icon: Calendar, label: t('client.myAppointments', 'Appointments') },
    { to: '/messages', icon: MessageSquare, label: t('chat.messages', 'Messages') },
  ]

  const navItems = isSuperAdmin ? superAdminNav : isOwner ? ownerNav : isWorker ? workerNav : clientNav

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 active:scale-95'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={24} 
                  className={`mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`}
                />
                <span className="text-xs font-medium truncate max-w-full">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default MobileBottomNav

