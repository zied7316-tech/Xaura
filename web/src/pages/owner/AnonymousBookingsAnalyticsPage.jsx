import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { financialService } from '../../services/financialService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { 
  Calendar, Users, DollarSign, TrendingUp, CheckCircle, 
  Clock, XCircle, User, Phone, Store, BarChart3 
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AnonymousBookingsAnalyticsPage = () => {
  const { salon } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const response = await financialService.getAnonymousBookingsAnalytics()
      console.log('Anonymous bookings analytics response:', response)
      // API interceptor already unwraps response.data, so response is { success, data: {...} }
      if (response && response.success && response.data) {
        setAnalytics(response.data)
      } else if (response && response.data) {
        // Fallback: if response structure is different
        setAnalytics(response.data)
      } else if (response) {
        // Fallback: if response is already the data object
        setAnalytics(response)
      } else {
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics: ' + (error.message || 'Unknown error'))
      setAnalytics(null)
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
        <p className="text-sm text-gray-500 mt-2">No anonymous bookings found yet</p>
      </div>
    )
  }

  const { 
    totalBookings = 0, 
    byStatus = {}, 
    byWorker = [], 
    totalRevenue = 0, 
    averageBookingValue = 0, 
    conversionRate = 0,
    recentBookings = [],
    monthlyTrends = {}
  } = analytics

  const getStatusBadge = (status) => {
    const config = {
      'Pending': { variant: 'warning', label: 'Pending' },
      'Confirmed': { variant: 'success', label: 'Confirmed' },
      'In Progress': { variant: 'default', label: 'In Progress' },
      'Completed': { variant: 'success', label: 'Completed' },
      'Cancelled': { variant: 'default', label: 'Cancelled' }
    }
    const { variant, label } = config[status] || config.Pending
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Anonymous Bookings Analytics</h1>
        <p className="text-gray-600 mt-1">
          Track and analyze bookings from your booking link page
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="mx-auto text-purple-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{totalBookings}</p>
            <p className="text-gray-600 text-sm">Total Bookings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{conversionRate}%</p>
            <p className="text-gray-600 text-sm">Conversion Rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto text-orange-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{formatCurrency(averageBookingValue)}</p>
            <p className="text-gray-600 text-sm">Avg Booking Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 mt-1">{status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worker Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Worker</CardTitle>
        </CardHeader>
        <CardContent>
          {byWorker.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No worker assignments yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Worker</th>
                    <th className="text-center p-3">Total Bookings</th>
                    <th className="text-center p-3">Completed</th>
                    <th className="text-right p-3">Total Revenue</th>
                    <th className="text-right p-3">Avg Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byWorker.map((worker, index) => (
                    <tr key={worker.workerId || 'unassigned'} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {index === 0 && byWorker[0].totalBookings > 0 && (
                            <span className="text-yellow-500">🏆</span>
                          )}
                          <span className="font-medium">{worker.workerName}</span>
                        </div>
                      </td>
                      <td className="text-center p-3">{worker.totalBookings}</td>
                      <td className="text-center p-3">{worker.completedBookings}</td>
                      <td className="text-right p-3 font-semibold">
                        {formatCurrency(worker.totalRevenue)}
                      </td>
                      <td className="text-right p-3 text-gray-600">
                        {formatCurrency(worker.averageRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      {monthlyTrends && Object.keys(monthlyTrends).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(monthlyTrends)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{month}</p>
                      <p className="text-sm text-gray-600">{data.count} bookings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(data.revenue)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent bookings</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking._id} className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="text-purple-600" size={18} />
                        <h3 className="font-semibold text-gray-900">{booking.clientName}</h3>
                        <div className="px-2 py-0.5 bg-purple-100 border border-purple-300 rounded-md">
                          <p className="text-xs text-purple-700 font-semibold">🔗 Anonymous</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {booking.clientPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(booking.dateTime)} at {formatTime(booking.dateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store size={14} />
                          {booking.workerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(booking.status)}
                        <span className="text-xs text-gray-500">
                          Booked: {formatDate(booking.createdAt)} at {formatTime(booking.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(booking.servicePriceAtBooking)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AnonymousBookingsAnalyticsPage

