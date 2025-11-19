import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { advancedBookingService } from '../../services/advancedBookingService'
import { salonService } from '../../services/salonService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import { 
  Repeat, Users, Calendar, Clock, X, Plus, Trash2,
  CheckCircle, AlertCircle
} from 'lucide-react'
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const AdvancedBookingPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('recurring')
  const [recurringAppointments, setRecurringAppointments] = useState([])
  const [groupBookings, setGroupBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [workers, setWorkers] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [recurringData, groupData, salonData] = await Promise.all([
        advancedBookingService.getRecurringAppointments(),
        advancedBookingService.getGroupBookings(),
        salonService.getJoinedSalon()
      ])
      
      setRecurringAppointments(recurringData.data || [])
      setGroupBookings(groupData.data || [])
      
      if (salonData) {
        setSalon(salonData)
        // Load services and workers
        const salonId = salonData._id || salonData.id
        if (salonId) {
          try {
            const servicesData = await salonService.getSalonServices(salonId)
            setServices(servicesData)
          } catch (error) {
            console.error('Error loading services:', error)
          }
          // Note: getSalonWorkers might not exist, skip for now
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRecurring = async (recurringId) => {
    if (!confirm('Cancel all future appointments in this series?')) return

    try {
      await advancedBookingService.cancelRecurring(recurringId)
      toast.success('Recurring appointment cancelled')
      loadData()
    } catch (error) {
      toast.error('Failed to cancel recurring appointment')
    }
  }

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case 'weekly': return 'Every Week'
      case 'biweekly': return 'Every 2 Weeks'
      case 'monthly': return 'Every Month'
      default: return frequency
    }
  }

  const getDayName = (dayOfWeek) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Salon Joined</h2>
        <p className="text-gray-600 mb-4">Join a salon to use advanced booking features</p>
        <Button onClick={() => navigate('/join-salon')}>
          Join Salon
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Booking</h1>
        <p className="text-gray-600 mt-1">Recurring appointments and group bookings</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary-200 bg-primary-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <Repeat className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Recurring Appointments</h3>
                <p className="text-gray-600 mt-1">Book weekly, bi-weekly, or monthly appointments automatically</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/book?recurring=true')}
              fullWidth
              className="mt-4"
            >
              <Plus size={18} />
              Set Up Recurring
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">Group Bookings</h3>
                <p className="text-gray-600 mt-1">Book multiple services in one session</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/book?group=true')}
              fullWidth
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={18} />
              Book Multiple Services
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'recurring'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Repeat className="inline mr-2" size={16} />
            Recurring ({recurringAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'group'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline mr-2" size={16} />
            Group Bookings ({groupBookings.length})
          </button>
        </div>
      </div>

      {/* Recurring Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          {recurringAppointments.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Repeat className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 mb-4">No recurring appointments yet</p>
                <Button onClick={() => navigate('/book?recurring=true')}>
                  <Plus size={18} />
                  Create Recurring Appointment
                </Button>
              </div>
            </Card>
          ) : (
            recurringAppointments.map((recurring) => (
              <Card key={recurring._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Repeat className="text-primary-600" size={24} />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {recurring.serviceId?.name}
                        </h3>
                        <Badge variant="primary">{getFrequencyLabel(recurring.frequency)}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
                        <div>
                          <span className="font-medium">Worker:</span> {recurring.workerId?.name}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {recurring.timeSlot}
                        </div>
                        {recurring.dayOfWeek !== undefined && (
                          <div>
                            <span className="font-medium">Day:</span> {getDayName(recurring.dayOfWeek)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Started:</span> {formatDate(recurring.startDate)}
                        </div>
                        {recurring.endDate && (
                          <div>
                            <span className="font-medium">Ends:</span> {formatDate(recurring.endDate)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Price:</span> {formatCurrency(recurring.serviceId?.price || 0)}
                        </div>
                      </div>

                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <CheckCircle className="inline mr-2" size={16} />
                        {recurring.generatedAppointments?.length || 0} appointments automatically created
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelRecurring(recurring._id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <X size={16} />
                      Cancel Series
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Group Bookings Tab */}
      {activeTab === 'group' && (
        <div className="space-y-4">
          {groupBookings.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Users className="mx-auto text-gray-400 mb-4" size={64} />
                <p className="text-gray-600 mb-4">No group bookings yet</p>
                <Button onClick={() => navigate('/book?group=true')}>
                  <Plus size={18} />
                  Create Group Booking
                </Button>
              </div>
            </Card>
          ) : (
            groupBookings.map((group) => (
              <Card key={group._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="text-blue-600" size={24} />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Group Booking - {group.services?.length} Services
                        </h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(group.bookingDate)} at {formatTime(group.bookingDate)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      group.overallStatus === 'Completed' ? 'success' :
                      group.overallStatus === 'Confirmed' ? 'primary' :
                      group.overallStatus === 'Cancelled' ? 'danger' :
                      'warning'
                    }>
                      {group.overallStatus}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {group.services?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-semibold">#{index + 1}</span>
                          <div>
                            <p className="font-medium text-gray-900">{item.serviceId?.name}</p>
                            <p className="text-sm text-gray-600">with {item.workerId?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {formatCurrency(item.serviceId?.price || 0)}
                          </p>
                          <Badge variant="outline" size="sm">{item.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {group.totalDuration} min total
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {group.services?.length} services
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(group.totalPrice)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AdvancedBookingPage




