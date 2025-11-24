import { useState, useEffect } from 'react'
import { workerStatusService } from '../../services/workerStatusService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { 
  Clock, Calendar, Coffee, Users, TrendingUp, 
  CheckCircle, XCircle, ArrowRight 
} from 'lucide-react'
import { formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkerAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [workerDetails, setWorkerDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadSalonAnalytics()
    
    // Poll for real-time worker status updates every 15 seconds
    const pollInterval = setInterval(() => {
      loadSalonAnalytics()
    }, 15000)
    
    return () => clearInterval(pollInterval)
  }, [filters])

  useEffect(() => {
    if (selectedWorker) {
      loadWorkerDetails(selectedWorker)
    }
  }, [selectedWorker, filters])

  const loadSalonAnalytics = async () => {
    try {
      const data = await workerStatusService.getSalonAnalytics(filters)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkerDetails = async (workerId) => {
    try {
      const data = await workerStatusService.getWorkerAnalytics(workerId, filters)
      setWorkerDetails(data)
    } catch (error) {
      console.error('Error loading worker details:', error)
      toast.error('Failed to load worker details')
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      available: { label: 'Available', variant: 'success', icon: CheckCircle },
      on_break: { label: 'On Break', variant: 'warning', icon: Coffee },
      offline: { label: 'Offline', variant: 'default', icon: XCircle }
    }
    const { label, variant, icon: Icon } = config[status] || config.offline
    return (
      <Badge variant={variant}>
        <Icon size={12} className="mr-1" />
        {label}
      </Badge>
    )
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Worker Analytics</h1>
          <p className="text-gray-600 mt-1">Track working hours, breaks, and availability</p>
        </div>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
              >
                Last 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
              >
                Last 30 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="mx-auto text-blue-600 mb-2" size={32} />
              <p className="text-2xl font-bold">{analytics.totalWorkers}</p>
              <p className="text-gray-600 text-sm">Total Workers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-2" size={32} />
              <p className="text-2xl font-bold text-green-600">{analytics.workersCurrentlyAvailable}</p>
              <p className="text-gray-600 text-sm">Available Now</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Coffee className="mx-auto text-orange-600 mb-2" size={32} />
              <p className="text-2xl font-bold text-orange-600">{analytics.workersOnBreak}</p>
              <p className="text-gray-600 text-sm">On Break</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="mx-auto text-red-600 mb-2" size={32} />
              <p className="text-2xl font-bold text-red-600">{analytics.workersOffline}</p>
              <p className="text-gray-600 text-sm">Offline</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workers List */}
        <Card>
          <CardHeader>
            <CardTitle>Workers Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics && analytics.workerStats.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No worker data for this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.workerStats.map((worker) => (
                  <div
                    key={worker.workerId}
                    onClick={() => setSelectedWorker(worker.workerId)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedWorker === worker.workerId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-gray-900">{worker.name}</div>
                        {getStatusBadge(worker.currentStatus)}
                      </div>
                      <ArrowRight size={18} className="text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={14} />
                        <span>{worker.totalWorkingHours}h worked</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Coffee size={14} />
                        <span>{worker.totalBreakHours}h breaks</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worker Details */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Details</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedWorker ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Select a worker to view details</p>
              </div>
            ) : !workerDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Worker Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-lg">
                      {workerDetails.worker.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{workerDetails.worker.name}</h3>
                    <p className="text-sm text-gray-500">{workerDetails.worker.email}</p>
                  </div>
                </div>

                {/* Total Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-green-600">
                      {workerDetails.totalStats.totalWorkingHours.toFixed(1)}h
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Days Worked</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {workerDetails.totalStats.totalDaysWorked}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Avg Hours/Day</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {workerDetails.totalStats.averageWorkingHoursPerDay.toFixed(1)}h
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Break Time</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {workerDetails.totalStats.totalBreakHours.toFixed(1)}h
                    </p>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Daily Breakdown</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {workerDetails.dailyStats.map((day) => (
                      <div key={day.date} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">
                            {formatDate(day.date)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {day.statusChanges} status changes
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Work</p>
                            <p className="font-semibold text-green-600">
                              {(day.totalWorkingMinutes / 60).toFixed(1)}h
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Break</p>
                            <p className="font-semibold text-orange-600">
                              {(day.totalBreakMinutes / 60).toFixed(1)}h
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Times</p>
                            <p className="font-semibold text-gray-900 text-xs">
                              {day.firstAvailable ? new Date(day.firstAvailable).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'} - {day.lastOffline ? new Date(day.lastOffline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default WorkerAnalyticsPage

