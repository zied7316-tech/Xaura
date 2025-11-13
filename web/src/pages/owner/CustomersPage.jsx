import { useState, useEffect } from 'react'
import { customerService } from '../../services/customerService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { 
  Users, Star, TrendingUp, Search, Calendar, DollarSign,
  Phone, Mail, MapPin, Gift, FileText, Plus, Award, History,
  MessageSquare
} from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const CustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  
  const [noteData, setNoteData] = useState({
    content: '',
    category: 'General',
    isImportant: false
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await customerService.getCustomers()
      setCustomers(data.data || [])
      setSummary(data.summary)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (customer) => {
    try {
      const details = await customerService.getCustomerDetails(customer._id)
      setSelectedCustomer(details.data)
      setShowDetailsModal(true)
    } catch (error) {
      toast.error('Failed to load customer details')
    }
  }

  const handleAddNote = async () => {
    if (!noteData.content) {
      toast.error('Please enter a note')
      return
    }

    try {
      await customerService.addCustomerNote(selectedCustomer.customer._id, noteData)
      toast.success('Note added successfully!')
      setShowNoteModal(false)
      setNoteData({ content: '', category: 'General', isImportant: false })
      // Reload customer details
      const details = await customerService.getCustomerDetails(selectedCustomer.customer._id)
      setSelectedCustomer(details.data)
    } catch (error) {
      toast.error('Failed to add note')
    }
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'vip') return matchesSearch && customer.status === 'VIP'
    if (filterStatus === 'active') {
      const daysSinceVisit = customer.stats.lastVisit
        ? (Date.now() - new Date(customer.stats.lastVisit)) / (1000 * 60 * 60 * 24)
        : 999
      return matchesSearch && daysSinceVisit <= 90
    }
    return matchesSearch
  })

  const noteCategories = [
    { value: 'General', label: 'General' },
    { value: 'Allergies', label: 'Allergies' },
    { value: 'Preferences', label: 'Preferences' },
    { value: 'Behavior', label: 'Behavior' },
    { value: 'Other', label: 'Other' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer CRM</h1>
        <p className="text-gray-600 mt-1">Manage customer relationships and track history</p>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VIP Customers</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{summary.vipCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="text-yellow-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active (90 days)</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{summary.activeCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary-600" size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Customers</option>
              <option value="vip">VIP Only</option>
              <option value="active">Active (90 days)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600">No customers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Visit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {customer.name}
                              {customer.status === 'VIP' && (
                                <Star className="text-yellow-500" size={16} fill="currentColor" />
                              )}
                            </div>
                            {customer.profile?.birthday && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Gift size={12} />
                                {formatDate(customer.profile.birthday)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone size={14} />
                            {customer.phone}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 mt-1">
                            <Mail size={14} />
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {customer.stats.totalVisits}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(customer.stats.totalSpent)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {formatCurrency(customer.stats.averageSpent)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {customer.stats.lastVisit 
                            ? formatDate(customer.stats.lastVisit)
                            : '-'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(customer)}
                        >
                          <FileText size={16} />
                          Details
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

      {/* Customer Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Customer Details"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Info Header */}
            <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedCustomer.customer.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {selectedCustomer.customer.name}
                      {selectedCustomer.customer.status === 'VIP' && (
                        <Badge variant="warning">
                          <Star size={12} fill="currentColor" />
                          VIP
                        </Badge>
                      )}
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {selectedCustomer.customer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {selectedCustomer.customer.email}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowNoteModal(true)
                    setShowDetailsModal(false)
                  }}
                >
                  <Plus size={16} />
                  Add Note
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedCustomer.appointments.filter(a => a.status === 'Completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Total Visits</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedCustomer.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">
                    {selectedCustomer.profile?.loyaltyPoints || 0}
                  </p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <Badge variant="outline" className="text-lg">
                    {selectedCustomer.profile?.membershipTier || 'Bronze'}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Tier</p>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-4">
                <button className="px-4 py-2 border-b-2 border-primary-600 text-primary-600 font-medium">
                  <History className="inline mr-2" size={16} />
                  Visit History
                </button>
              </div>
            </div>

            {/* Visit History */}
            <div className="max-h-96 overflow-y-auto">
              {selectedCustomer.appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No visit history yet
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.appointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              appointment.status === 'Completed' ? 'success' :
                              appointment.status === 'Cancelled' ? 'danger' :
                              'default'
                            }>
                              {appointment.status}
                            </Badge>
                            <span className="font-medium">{appointment.serviceId?.name}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">with {appointment.workerId?.name}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(appointment.dateTime)} at {formatTime(appointment.dateTime)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(appointment.servicePriceAtBooking)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes Section */}
            {selectedCustomer.profile?.notes && selectedCustomer.profile.notes.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare size={18} />
                  Notes ({selectedCustomer.profile.notes.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCustomer.profile.notes.map((note, index) => (
                    <div key={index} className={`border-l-4 ${note.isImportant ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-r-lg p-3`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="text-xs mb-2">
                            {note.category}
                          </Badge>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                        {note.isImportant && (
                          <Award className="text-red-500" size={16} />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => {
          setShowNoteModal(false)
          setShowDetailsModal(true)
        }}
        title="Add Customer Note"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Category"
            value={noteData.category}
            onChange={(e) => setNoteData({ ...noteData, category: e.target.value })}
            options={noteCategories}
          />

          <Textarea
            label="Note"
            required
            rows={4}
            value={noteData.content}
            onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
            placeholder="Enter note about this customer..."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="important"
              checked={noteData.isImportant}
              onChange={(e) => setNoteData({ ...noteData, isImportant: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="important" className="text-sm text-gray-700">
              Mark as important (allergies, special requirements)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleAddNote} fullWidth>
              <Plus size={18} />
              Add Note
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNoteModal(false)
                setShowDetailsModal(true)
              }} 
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CustomersPage
