import { useState, useEffect } from 'react'
import { salonClientService } from '../../services/salonClientService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Textarea from '../../components/ui/Textarea'
import { 
  Users, User, Mail, Phone, Calendar, DollarSign, 
  Search, Star, Award, TrendingUp, Eye
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const SalonClientsPage = () => {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientDetails, setClientDetails] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    sortBy: 'newest'
  })

  useEffect(() => {
    loadClients()
  }, [filters.status, filters.sortBy])

  const loadClients = async () => {
    try {
      const data = await salonClientService.getSalonClients({
        status: filters.status,
        sortBy: filters.sortBy
      })
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const searchTerm = filters.search.toLowerCase()
    if (!searchTerm) {
      loadClients()
      return
    }
    
    const filtered = clients.filter(c =>
      c.clientId.name.toLowerCase().includes(searchTerm) ||
      c.clientId.email.toLowerCase().includes(searchTerm)
    )
    setClients(filtered)
  }

  const handleViewDetails = async (client) => {
    setSelectedClient(client)
    try {
      const details = await salonClientService.getClientDetails(client.clientId._id)
      setClientDetails(details)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error loading client details:', error)
      toast.error('Failed to load client details')
    }
  }

  const handleUpdateStatus = async (clientId, newStatus) => {
    try {
      await salonClientService.updateClientStatus(clientId, newStatus)
      toast.success('Client status updated!')
      loadClients()
      if (showDetailsModal) {
        setShowDetailsModal(false)
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      active: { label: 'Active', variant: 'success' },
      inactive: { label: 'Inactive', variant: 'default' },
      vip: { label: 'VIP', variant: 'warning' }
    }
    const { label, variant } = config[status] || config.active
    return <Badge variant={variant}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    vip: clients.filter(c => c.status === 'vip').length,
    totalRevenue: clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salon Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client list and relationships</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto text-blue-600 mb-2" size={32} />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-gray-600 text-sm">Total Clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto text-green-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            <p className="text-gray-600 text-sm">Active Clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="mx-auto text-yellow-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-yellow-600">{stats.vip}</p>
            <p className="text-gray-600 text-sm">VIP Clients</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto text-purple-600 mb-2" size={32} />
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                icon={<Search size={18} className="text-gray-400" />}
              />
            </div>
            
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'vip', label: 'VIP' },
                { value: 'inactive', label: 'Inactive' }
              ]}
            />

            <Select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'appointments', label: 'Most Appointments' }
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clients Yet</h3>
              <p className="text-gray-600 mb-4">
                Clients will appear here when they scan your salon's QR code or book appointments
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Appointments</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Spent</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Visit</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {client.clientId.avatar ? (
                            <img
                              src={uploadService.getImageUrl(client.clientId.avatar)}
                              alt={client.clientId.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="text-primary-600" size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{client.clientId.name}</p>
                            <p className="text-sm text-gray-500">{client.clientId.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {client.actualAppointmentCount || client.totalAppointments}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-green-600">
                        {formatCurrency(client.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(client.joinedAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {client.lastVisit ? formatDate(client.lastVisit) : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(client)}
                        >
                          <Eye size={16} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedClient(null)
          setClientDetails(null)
        }}
        title="Client Details"
        size="lg"
      >
        {clientDetails && (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="flex items-start gap-4 pb-4 border-b">
              {clientDetails.client.clientId.avatar ? (
                <img
                  src={uploadService.getImageUrl(clientDetails.client.clientId.avatar)}
                  alt={clientDetails.client.clientId.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="text-primary-600" size={32} />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{clientDetails.client.clientId.name}</h3>
                <p className="text-gray-600">{clientDetails.client.clientId.email}</p>
                {clientDetails.client.clientId.phone && (
                  <p className="text-gray-600">📞 {clientDetails.client.clientId.phone}</p>
                )}
                {clientDetails.client.clientId.birthday && (
                  <p className="text-gray-600 flex items-center gap-1">
                    <Calendar size={14} />
                    Birthday: {formatDate(clientDetails.client.clientId.birthday)}
                    {(() => {
                      const today = new Date()
                      const birthday = new Date(clientDetails.client.clientId.birthday)
                      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())
                      const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24))
                      if (daysUntil === 0) {
                        return <span className="ml-2 text-yellow-600 font-semibold">🎉 Today!</span>
                      } else if (daysUntil > 0 && daysUntil <= 7) {
                        return <span className="ml-2 text-primary-600 font-semibold">🎁 In {daysUntil} days</span>
                      }
                      return null
                    })()}
                  </p>
                )}
                <div className="mt-2">
                  {getStatusBadge(clientDetails.client.status)}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Total Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{clientDetails.appointmentCount}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(clientDetails.totalSpent)}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                <p className="text-lg font-bold text-purple-600">{formatDate(clientDetails.client.joinedAt)}</p>
              </div>
            </div>

            {/* Status Management */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Status</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={clientDetails.client.status === 'active' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(clientDetails.client.clientId._id, 'active')}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={clientDetails.client.status === 'vip' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(clientDetails.client.clientId._id, 'vip')}
                >
                  <Star size={16} />
                  VIP
                </Button>
                <Button
                  size="sm"
                  variant={clientDetails.client.status === 'inactive' ? 'primary' : 'outline'}
                  onClick={() => handleUpdateStatus(clientDetails.client.clientId._id, 'inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Recent Appointments */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Appointments</h4>
              {clientDetails.appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">No appointments yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {clientDetails.appointments.map((apt) => (
                    <div key={apt._id} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{apt.serviceId?.name || 'Service'}</p>
                        <p className="text-sm text-gray-600">{formatDate(apt.startTime)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(apt.serviceId?.price || 0)}</p>
                        <Badge variant={apt.status === 'Confirmed' ? 'success' : 'default'} size="sm">
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SalonClientsPage

