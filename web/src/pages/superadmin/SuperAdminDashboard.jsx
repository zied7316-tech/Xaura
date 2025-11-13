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
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const SuperAdminDashboard = () => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Platform-wide Xaura management</p>
            </div>
          </div>
        </div>
        <Link to="/super-admin/salons">
          <Button>
            <Building size={18} />
            Manage Salons
          </Button>
        </Link>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Salons</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{overview.totalSalons}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Store className="text-primary-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Appointments</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{overview.totalAppointments.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Platform Revenue</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {formatCurrency(revenue.platform.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-yellow-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Salon Owners</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalOwners}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Workers</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalWorkers}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalClients.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Appointments</span>
                <span className="text-2xl font-bold text-gray-900">{revenue.today.appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(revenue.today.revenue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Appointments</span>
                <span className="text-2xl font-bold text-gray-900">{revenue.thisMonth.appointments}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revenue</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(revenue.thisMonth.revenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Salons</span>
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
            Your Subscription Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-3xl font-bold text-primary-600">{revenue.subscriptions.activeSubscriptions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monthly Recurring Revenue (MRR)</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(revenue.subscriptions.monthlyRecurring)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Subscription Revenue</p>
              <p className="text-3xl font-bold text-yellow-600">{formatCurrency(revenue.subscriptions.totalRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/super-admin/salons">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full border-2">
                <Store className="text-primary-600 mb-2" size={32} />
                <span className="text-sm font-medium">Manage Salons</span>
                <span className="text-xs text-gray-500 mt-1">{overview.totalSalons} total</span>
              </button>
            </Link>

            <Link to="/super-admin/users">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full border-2">
                <Users className="text-blue-600 mb-2" size={32} />
                <span className="text-sm font-medium">All Users</span>
                <span className="text-xs text-gray-500 mt-1">{overview.totalUsers.toLocaleString()} total</span>
              </button>
            </Link>

            <Link to="/super-admin/analytics">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full border-2">
                <TrendingUp className="text-green-600 mb-2" size={32} />
                <span className="text-sm font-medium">Growth Analytics</span>
                <span className="text-xs text-gray-500 mt-1">Charts & trends</span>
              </button>
            </Link>

            <Link to="/super-admin/subscriptions">
              <button className="flex flex-col items-center p-4 hover:bg-gray-50 rounded-lg transition-colors w-full border-2">
                <Crown className="text-yellow-600 mb-2" size={32} />
                <span className="text-sm font-medium">Subscriptions</span>
                <span className="text-xs text-gray-500 mt-1">{revenue.subscriptions.activeSubscriptions} active</span>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SuperAdminDashboard




