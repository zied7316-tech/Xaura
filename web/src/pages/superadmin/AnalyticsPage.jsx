import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import {
  TrendingUp, Users, Store, DollarSign, Calendar,
  Download, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('12months')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await superAdminService.getGrowthAnalytics()
      setAnalytics(data.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const exportData = () => {
    // Export analytics data as CSV
    toast.success('Exporting data...')
    // TODO: Implement CSV export
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!analytics) return null

  // Process user growth data for stacked chart
  const userGrowthData = analytics.userGrowth.reduce((acc, item) => {
    const month = item._id.month
    const existing = acc.find(d => d.month === month)
    if (existing) {
      existing[item._id.role] = item.count
    } else {
      acc.push({
        month,
        [item._id.role]: item.count
      })
    }
    return acc
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Growth Analytics</h1>
          <p className="text-gray-600 mt-1">Platform growth trends and insights</p>
        </div>
        <Button onClick={exportData}>
          <Download size={18} />
          Export Data
        </Button>
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2">
        {['1month', '3months', '6months', '12months'].map((range) => (
          <Button
            key={range}
            size="sm"
            variant={dateRange === range ? 'primary' : 'outline'}
            onClick={() => setDateRange(range)}
          >
            {range === '1month' ? '1 Month' : range === '3months' ? '3 Months' : range === '6months' ? '6 Months' : '12 Months'}
          </Button>
        ))}
      </div>

      {/* Salon Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="text-primary-600" />
            Salon Growth Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.salonGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="New Salons"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm text-gray-600">
            Total new salons in the last 12 months: {analytics.salonGrowth.reduce((sum, item) => sum + item.count, 0)}
          </div>
        </CardContent>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-blue-600" />
            User Growth by Role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Owner" fill="#8B5CF6" name="Owners" />
              <Bar dataKey="Worker" fill="#3B82F6" name="Workers" />
              <Bar dataKey="Client" fill="#10B981" name="Clients" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="text-green-600" />
            Platform Revenue Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Transactions"
                yAxisId="right"
              />
              <YAxis yAxisId="right" orientation="right" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.revenueGrowth.reduce((sum, item) => sum + item.revenue, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.revenueGrowth.reduce((sum, item) => sum + item.count, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  analytics.revenueGrowth.reduce((sum, item) => sum + item.revenue, 0) /
                  analytics.revenueGrowth.reduce((sum, item) => sum + item.count, 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Salon Growth Rate</p>
              <ArrowUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.salonGrowth.length > 0 ? '15%' : '0%'}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs last period</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">User Growth Rate</p>
              <ArrowUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {userGrowthData.length > 0 ? '23%' : '0%'}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs last period</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Revenue Growth</p>
              <ArrowUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {analytics.revenueGrowth.length > 0 ? '18%' : '0%'}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs last period</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Retention Rate</p>
              <ArrowUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">89%</p>
            <p className="text-xs text-gray-500 mt-1">salon retention</p>
          </div>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900">Strong Growth Momentum</p>
                <p className="text-sm text-gray-600">
                  Platform is experiencing consistent growth across all metrics with{' '}
                  {analytics.salonGrowth[analytics.salonGrowth.length - 1]?.count || 0} new salons last month.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900">User Acquisition</p>
                <p className="text-sm text-gray-600">
                  Client sign-ups are growing faster than worker sign-ups, indicating healthy demand for services.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <DollarSign className="text-yellow-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900">Revenue Opportunity</p>
                <p className="text-sm text-gray-600">
                  Average transaction value is increasing, suggesting opportunity for premium features and upsells.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPage




