import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { financialService } from '../../services/financialService'
import { appointmentService } from '../../services/appointmentService'
import { subscriptionService } from '../../services/subscriptionService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Store, Calendar, Users, Scissors, TrendingUp, DollarSign, AlertCircle, Package, TrendingDown, CreditCard, Clock, CheckCircle, Crown, Zap, UserPlus } from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers'
import { StatusBadge } from '../../components/ui/Badge'
import { useLanguage } from '../../context/LanguageContext'

const OwnerDashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch enhanced analytics
        const analyticsData = await financialService.getDashboardAnalytics()
        setAnalytics(analyticsData)
        
        // Fetch recent appointments
        const appointmentsData = await appointmentService.getAppointments()
        setAppointments(appointmentsData.slice(0, 5))

        // Fetch subscription status
        try {
          const subscriptionData = await subscriptionService.getMySubscription()
          setSubscription(subscriptionData.data)
        } catch (error) {
          console.error('Error fetching subscription:', error)
          // Subscription might not exist yet, that's okay
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('owner.businessDashboard', 'Business Dashboard')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('owner.welcomeBack', 'Welcome back')}, {user?.name}
            {user?.userID && (
              <span className="ml-2 text-sm font-mono text-primary-600">#{user.userID}</span>
            )}
          </p>
        </div>
        <Link to="/owner/salon">
          <Button>
            <Store size={20} />
            {t('owner.manageSalon', 'Manage Salon')}
          </Button>
        </Link>
      </div>

      {/* Subscription Status Card */}
      {subscription && (
        <Card className="border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {subscription.status === 'trial' ? (
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="text-yellow-600" size={32} />
                  </div>
                ) : subscription.plan === 'basic' ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                ) : subscription.plan === 'pro' ? (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="text-blue-600" size={32} />
                  </div>
                ) : subscription.plan === 'enterprise' ? (
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Crown className="text-purple-600" size={32} />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <CreditCard className="text-gray-600" size={32} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {subscription.status === 'trial' 
                      ? t('owner.freeTrialActive', 'Free Trial Active') 
                      : subscription.plan 
                        ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} ${t('owner.plan', 'Plan')}`
                        : t('owner.noActivePlan', 'No Active Plan')}
                  </h3>
                  {subscription.status === 'trial' ? (
                    <p className="text-sm text-gray-600 mt-1">
                      {subscription.trialDaysRemaining || 0} {t('owner.daysRemaining', 'days remaining')}
                      {subscription.needsConfirmation && (
                        <span className="ml-2 text-yellow-600 font-semibold">• {t('owner.confirmationNeeded', 'Confirmation needed')}</span>
                      )}
                    </p>
                  ) : subscription.plan ? (
                    <p className="text-sm text-gray-600 mt-1">
                      {subscription.billingInterval === 'year' 
                        ? `${t('owner.annualBilling', 'Annual billing')} • ${formatCurrency(subscription.price || 0)}/year`
                        : `${t('owner.monthlyBilling', 'Monthly billing')} • ${formatCurrency(subscription.monthlyFee || subscription.price || 0)}/month`}
                    </p>
                  ) : (
                    <p className="text-sm text-red-600 mt-1">
                      {t('owner.choosePlanToContinue', 'Please choose a plan to continue')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={subscription.status} />
                <Link to="/owner/subscription">
                  <Button variant="primary">
                    <CreditCard size={18} className="mr-2" />
                    {t('owner.managePlan', 'Manage Plan')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Action: Walk-in Client - Only show if owner has worksAsWorker enabled */}
      {user?.worksAsWorker && (
        <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <UserPlus className="text-white" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {t('worker.walkInClients', 'Walk-in Client')}
                </h3>
                <p className="text-gray-600">
                  {t('worker.walkInDescription', 'Client came without booking? Add them here')}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/worker/walk-in')}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700"
            >
              <UserPlus size={20} />
              {t('worker.addWalkInClient', 'Add Walk-in Client')}
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Grid - ENHANCED with Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t('owner.revenueToday', 'Revenue Today')}
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(analytics?.revenue?.today || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        {/* Revenue This Month */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t('owner.revenueThisMonth', 'Revenue This Month')}
              </p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {formatCurrency(analytics?.revenue?.thisMonth || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-primary-600" size={24} />
            </div>
          </div>
        </Card>

        {/* Appointments Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t('owner.appointmentsToday', 'Appointments Today')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics?.appointments?.today || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        {/* Total Customers */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {t('owner.totalCustomers', 'Total Customers')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics?.customers?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Business Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t('owner.totalRevenue', 'Total Revenue')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(analytics?.revenue?.total || 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t('owner.totalAppointments', 'Total Appointments')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {analytics?.appointments?.total || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="text-yellow-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t('owner.pending', 'Pending')}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {analytics?.appointments?.pending || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions - ENHANCED with Business Features */}
      <Card>
        <CardHeader>
          <CardTitle>{t('owner.businessManagement', 'Business Management')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Link to="/owner/salon">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Store className="text-primary-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.salonSettings', 'Salon Settings')}
                </span>
              </button>
            </Link>
            <Link to="/owner/services">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Scissors className="text-blue-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.services', 'Services')}
                </span>
              </button>
            </Link>
            <Link to="/owner/workers">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Users className="text-purple-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.workers', 'Workers')}
                </span>
              </button>
            </Link>
            <Link to="/owner/finances">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <DollarSign className="text-green-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.finances', 'Finances')}
                </span>
                <span className="text-xs text-green-600 font-bold">NEW</span>
              </button>
            </Link>
            <Link to="/owner/customers">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Users className="text-orange-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.customers', 'Customers')}
                </span>
                <span className="text-xs text-orange-600 font-bold">NEW</span>
              </button>
            </Link>
            <Link to="/owner/inventory">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Package className="text-indigo-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.inventory', 'Inventory')}
                </span>
                <span className="text-xs text-indigo-600 font-bold">NEW</span>
              </button>
            </Link>
            <Link to="/owner/reports">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <TrendingUp className="text-pink-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.reports', 'Reports')}
                </span>
                <span className="text-xs text-pink-600 font-bold">NEW</span>
              </button>
            </Link>
            <Link to="/owner/subscription">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <CreditCard className="text-indigo-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.subscription', 'Subscription')}
                </span>
                <span className="text-xs text-indigo-600 font-bold">NEW</span>
              </button>
            </Link>
            <Link to="/appointments">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full">
                <Calendar className="text-teal-600 mb-2" size={28} />
                <span className="text-sm font-medium text-center">
                  {t('owner.appointments', 'Appointments')}
                </span>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('owner.recentAppointments', 'Recent Appointments')}</CardTitle>
            <Link to="/appointments">
              <Button variant="ghost" size="sm">
                {t('common.viewAll', 'View All')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('owner.noAppointmentsYet', 'No appointments yet')}
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{appointment.clientId?.name || 'Unknown Client'}</div>
                    <div className="text-sm text-gray-600">
                      {appointment.serviceId?.name} • {formatDate(appointment.dateTime)} at {formatTime(appointment.dateTime)}
                    </div>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OwnerDashboard

