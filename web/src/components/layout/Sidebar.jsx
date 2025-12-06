import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import DownloadAppButton from '../download/DownloadAppButton'
import Logo from '../ui/Logo'
import {  
  LayoutDashboard, 
  Store, 
  Scissors, 
  Users, 
  Calendar, 
  X,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Bell,
  Repeat,
  Activity,
  CreditCard,
  FileText,
  MessageSquare,
  MapPin,
  Wifi,
  QrCode,
  ShoppingCart,
  Wrench,
  BarChart3
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSuperAdmin, isOwner, isWorker, isClient } = useAuth()
  const { t } = useLanguage()

  const superAdminLinks = [
    { to: '/super-admin/dashboard', icon: LayoutDashboard, label: t('superAdmin.platformDashboard', 'Platform Dashboard') },
    { to: '/super-admin/salons', icon: Store, label: t('superAdmin.allSalons', 'All Salons') },
    { to: '/super-admin/users', icon: Users, label: t('superAdmin.allUsers', 'All Users') },
    { to: '/super-admin/analytics', icon: TrendingUp, label: t('superAdmin.growthAnalytics', 'Growth Analytics') },
    { to: '/super-admin/subscriptions', icon: DollarSign, label: t('superAdmin.subscriptions', 'Subscriptions') },
    { to: '/super-admin/pending-approvals', icon: Clock, label: 'Pending Approvals', badge: 'NEW' },
    { to: '/super-admin/billing', icon: CreditCard, label: t('superAdmin.billing', 'Billing & Revenue'), badge: 'NEW' },
    { to: '/super-admin/reports', icon: FileText, label: t('superAdmin.reports', 'Advanced Reports'), badge: 'NEW' },
    { to: '/super-admin/campaigns', icon: Bell, label: t('superAdmin.campaigns', 'Email Campaigns'), badge: 'NEW' },
    { to: '/super-admin/support', icon: MessageSquare, label: t('superAdmin.support', 'Support Tickets'), badge: 'NEW' },
    { to: '/super-admin/activity-logs', icon: Activity, label: t('superAdmin.activityLogs', 'Activity Logs'), badge: 'NEW' },
  ]

  const ownerLinks = [
    { to: '/owner/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/owner/subscription', icon: CreditCard, label: 'Subscription', badge: 'NEW' },
    { to: '/owner/salons', icon: Store, label: t('owner.mySalons', 'My Salons'), badge: 'NEW' },
    { to: '/owner/salon', icon: Store, label: t('owner.salonSettings', 'Salon Settings') },
    { to: '/owner/services', icon: Scissors, label: t('owner.services', 'Services') },
    { to: '/owner/workers', icon: Users, label: t('owner.workers', 'Workers') },
    { to: '/owner/salon-clients', icon: Users, label: t('owner.clients', 'Client List'), badge: 'NEW' },
    { to: '/owner/worker-payments', icon: DollarSign, label: 'Worker Payments', badge: 'NEW' },
    { to: '/owner/worker-analytics', icon: TrendingUp, label: 'Worker Analytics', badge: 'NEW' },
    { to: '/appointments', icon: Calendar, label: t('owner.appointments', 'Appointments') },
    { to: '/owner/anonymous-bookings-analytics', icon: QrCode, label: 'Anonymous Bookings', badge: 'NEW' },
    { to: '/owner/finances', icon: DollarSign, label: t('owner.finances', 'Finances'), badge: 'NEW' },
    { to: '/owner/customers', icon: Users, label: 'Customers', badge: 'NEW' },
    { to: '/owner/products-for-sale', icon: ShoppingCart, label: 'Products for Sale', badge: 'NEW' },
    { to: '/owner/products-for-use', icon: Wrench, label: 'Products for Use', badge: 'NEW' },
    { to: '/owner/reports', icon: TrendingUp, label: t('owner.reports', 'Reports'), badge: 'NEW' },
    { to: '/owner/reminders', icon: Bell, label: t('owner.reminders', 'SMS/Email Reminders'), badge: 'NEW' },
    { to: '/owner/loyalty', icon: Store, label: t('owner.loyalty', 'Loyalty & Rewards'), badge: 'NEW' },
    { to: '/owner/worker-tracking', icon: MapPin, label: 'Worker Tracking', badge: 'NEW' },
  ]

  const workerLinks = [
    { to: '/worker/dashboard', icon: LayoutDashboard, label: t('worker.myDashboard', 'My Dashboard') },
    { to: '/worker/availability', icon: Clock, label: t('worker.myAvailability', 'My Availability'), badge: 'NEW' },
    { to: '/worker/appointments', icon: Calendar, label: t('worker.myAppointments', 'My Appointments'), badge: 'NEW' },
    { to: '/worker/products-for-sale', icon: ShoppingCart, label: 'Products for Sale', badge: 'NEW' },
    { to: '/worker/products-for-use', icon: Wrench, label: 'Products for Use', badge: 'NEW' },
    { to: '/messages', icon: MessageSquare, label: t('chat.messages', 'Messages'), badge: 'NEW' },
    { to: '/worker/finances', icon: DollarSign, label: t('worker.myFinances', 'My Finances'), badge: 'NEW' },
  ]

  const clientLinks = [
    { to: '/client/dashboard', icon: LayoutDashboard, label: t('common.dashboard', 'Dashboard') },
    { to: '/search-salons', icon: Store, label: t('client.findSalons', 'Find Salons'), badge: 'NEW' },
    { to: '/join-salon', icon: QrCode, label: 'Join via QR', badge: 'NEW' },
    { to: '/appointments', icon: Calendar, label: t('client.myAppointments', 'My Appointments') },
    { to: '/messages', icon: MessageSquare, label: t('chat.messages', 'Messages'), badge: 'NEW' },
    { to: '/client/advanced-booking', icon: Repeat, label: t('client.recurringBooking', 'Recurring & Groups'), badge: 'NEW' },
    { to: '/client/rewards', icon: Store, label: t('client.myRewards', 'My Rewards'), badge: 'NEW' },
  ]

  const links = isSuperAdmin ? superAdminLinks : isOwner ? ownerLinks : isWorker ? workerLinks : clientLinks

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl border-r border-gray-200 z-40 lg:z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <Logo size="md" showText={true} linkTo="/" />
            <button onClick={onClose} className="lg:hidden text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <link.icon size={20} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Download App Button (Android only) */}
          <div className="px-4 pb-4 border-t pt-4">
            <DownloadAppButton />
          </div>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {user?.name?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                  {user?.userID && (
                    <span className="ml-2 text-xs font-mono text-primary-600">#{user.userID}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

