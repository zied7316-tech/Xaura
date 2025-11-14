import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  Store, Users, Calendar, DollarSign, TrendingUp,
  Activity, Crown, Building
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import { useLanguage } from '../../context/LanguageContext'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const SuperAdminDashboard = () => {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await superAdminService.getDashboardStats()
      setStats(data.data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!stats) return null

  const { overview, revenue } = stats

  return (
    <div className="space-y-6">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('superAdmin.platformDashboard', 'Super Admin Dashboard')}</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5">{t('superAdmin.platformManagement', 'Platform-wide Xaura management')}</p>
            </div>
          </div>
        </div>
        <Link to="/super-admin/salons" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto justify-center">
            <Building size={18} />
            {t('superAdmin.allSalons', 'Manage Salons')}
          </Button>
        </Link>
      </div>

      {/* Platform Overview - Mobile optimized grid (2 cols on mobile, 4 on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer active:scale-98">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.totalSalons', 'Total Salons')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary-600 mt-1">{overview.totalSalons}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-lg flex items-center justify-center order-1 sm:order-2">
              <Store className="text-primary-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer active:scale-98">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.totalUsers', 'Total Users')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center order-1 sm:order-2">
              <Users className="text-blue-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer active:scale-98">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.totalAppointments', 'Total Appointments')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{overview.totalAppointments.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center order-1 sm:order-2">
              <Calendar className="text-green-600" size={20} />
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer active:scale-98">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="order-2 sm:order-1">
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.platformRevenue', 'Platform Revenue')}</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                {formatCurrency(revenue.platform.totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center order-1 sm:order-2">
              <DollarSign className="text-yellow-600" size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* User Breakdown - Mobile: 3 cols in one row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6">
        <Card className="hover:shadow-md transition-shadow active:scale-98">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0">
              <Building className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.salonOwners', 'Salon Owners')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{overview.totalOwners}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow active:scale-98">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.workers', 'Workers')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{overview.totalWorkers}</p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow active:scale-98">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('superAdmin.clients', 'Clients')}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{overview.totalClients.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('superAdmin.todaysActivity', "Today's Activity")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('superAdmin.newAppointments', 'New Appointments')}</span>
                <span className="text-2xl font-bold text-gray-900">{revenue.today.appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('superAdmin.revenue', 'Revenue')}</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(revenue.today.revenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('superAdmin.thisMonth', 'This Month')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('appointments.upcoming', 'Appointments')}</span>
                <span className="text-2xl font-bold text-gray-900">{revenue.thisMonth.appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('superAdmin.revenue', 'Revenue')}</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(revenue.thisMonth.revenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('superAdmin.newSalons', 'New Salons')}</span>
                <span className="text-2xl font-bold text-primary-600">{revenue.thisMonth.newSalons}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="text-yellow-600" />
            {t('superAdmin.monthlyRevenue', 'Your Subscription Revenue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">{t('superAdmin.activeSubscriptions', 'Active Subscriptions')}</p>
              <p className="text-3xl font-bold text-primary-600">{revenue.subscriptions.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('superAdmin.monthlyRevenue', 'Monthly Recurring Revenue (MRR)')}</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(revenue.subscriptions.monthlyRecurring)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('superAdmin.totalRevenue', 'Total Subscription Revenue')}</p>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(revenue.subscriptions.totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Mobile optimized with bigger touch targets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{t('superAdmin.platformManagement', 'Platform Management')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Link to="/super-admin/salons" className="block">
              <button className="flex flex-col items-center p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-all w-full border-2 border-gray-200 hover:border-primary-300 hover:shadow-md min-h-[120px] sm:min-h-[130px]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-100 rounded-full flex items-center justify-center mb-2">
                  <Store className="text-primary-600" size={24} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{t('superAdmin.allSalons', 'Manage Salons')}</span>
                <span className="text-xs text-gray-500 mt-1">{overview.totalSalons} {t('common.total', 'total')}</span>
              </button>
            </Link>

            <Link to="/super-admin/users" className="block">
              <button className="flex flex-col items-center p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-all w-full border-2 border-gray-200 hover:border-blue-300 hover:shadow-md min-h-[120px] sm:min-h-[130px]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Users className="text-blue-600" size={24} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{t('superAdmin.allUsers', 'All Users')}</span>
                <span className="text-xs text-gray-500 mt-1">{overview.totalUsers.toLocaleString()} {t('common.total', 'total')}</span>
              </button>
            </Link>

            <Link to="/super-admin/analytics" className="block">
              <button className="flex flex-col items-center p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-all w-full border-2 border-gray-200 hover:border-green-300 hover:shadow-md min-h-[120px] sm:min-h-[130px]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{t('superAdmin.growthAnalytics', 'Growth Analytics')}</span>
                <span className="text-xs text-gray-500 mt-1 truncate max-w-full">{t('common.details', 'Charts & trends')}</span>
              </button>
            </Link>

            <Link to="/super-admin/subscriptions" className="block">
              <button className="flex flex-col items-center p-4 sm:p-5 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-all w-full border-2 border-gray-200 hover:border-yellow-300 hover:shadow-md min-h-[120px] sm:min-h-[130px]">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                  <Crown className="text-yellow-600" size={24} />
                </div>
                <span className="text-sm sm:text-base font-semibold text-gray-900">{t('superAdmin.subscriptions', 'Subscriptions')}</span>
                <span className="text-xs text-gray-500 mt-1">{revenue.subscriptions.activeSubscriptions} {t('common.status', 'active')}</span>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard




