import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  Users, Search, Filter, Ban, CheckCircle, XCircle, 
  Eye, Trash2, UserX, UserCheck, History, Calendar, 
  TrendingUp, DollarSign, Building, UserPlus, UserMinus
} from 'lucide-react'
import { formatDate, formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: '',
    page: 1,
    limit: 50
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [userDetails, setUserDetails] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await superAdminService.getAllUsers(filters)
      setUsers(data.data || [])
      setPagination({
        page: data.page,
        pages: data.pages,
        total: data.total
      })
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 })
  }

  const handleRoleFilter = (role) => {
    setFilters({ ...filters, role, page: 1 })
  }

  const handleStatusFilter = (status) => {
    setFilters({ ...filters, status, page: 1 })
  }

  const handleViewDetails = async (user) => {
    try {
      setSelectedUser(user)
      const data = await superAdminService.getUserDetails(user._id)
      setUserDetails(data.data)
      setShowDetailsModal(true)
    } catch (error) {
      toast.error('Failed to load user details')
    }
  }

  const handleBanUser = async (userId, currentStatus) => {
    const action = currentStatus ? 'ban' : 'unban'
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      await superAdminService.updateUserStatus(userId, !currentStatus)
      toast.success(`User ${action}ned successfully`)
      loadUsers()
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      await superAdminService.deleteUser(userId)
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const getRoleBadge = (role) => {
    const variants = {
      SuperAdmin: 'warning',
      Owner: 'primary',
      Worker: 'info',
      Client: 'success'
    }
    return <Badge variant={variants[role] || 'default'}>{role}</Badge>
  }

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="danger">Banned</Badge>
    )
  }

  if (loading && users.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage all users across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Owners</p>
            <p className="text-2xl font-bold text-primary-600">
              {users.filter(u => u.role === 'Owner').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Workers</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'Worker').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-gray-600">Clients</p>
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.role === 'Client').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex gap-2">
              {['all', 'Owner', 'Worker', 'Client'].map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={filters.role === role ? 'primary' : 'outline'}
                  onClick={() => handleRoleFilter(role)}
                >
                  {role === 'all' ? 'All Roles' : role}
                </Button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={filters.status === status ? 'primary' : 'outline'}
                  onClick={() => handleStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Salon</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4">
                      {user.salonId ? (
                        <div className="text-sm text-gray-600">{user.salonId.name}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(user.isActive)}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye size={16} />
                        </Button>
                        {user.role !== 'SuperAdmin' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBanUser(user._id, user.isActive)}
                              className={user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                            >
                              {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetailsModal && userDetails && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUser(null)
            setUserDetails(null)
          }}
          title="User Details"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{userDetails.user.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{userDetails.user.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{userDetails.user.phone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Role:</span>
                  <p>{getRoleBadge(userDetails.user.role)}</p>
                </div>
              </div>
            </div>

            {/* Role-specific Stats */}
            <div>
              <h3 className="font-semibold mb-2">Activity Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {userDetails.user.role === 'Client' && (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">Total Appointments</p>
                      <p className="text-xl font-bold">{userDetails.stats.totalAppointments || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Total Spent</p>
                      <p className="text-xl font-bold">{formatCurrency(userDetails.stats.totalSpent || 0)}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Salons Visited</p>
                      <p className="text-xl font-bold">{userDetails.stats.salonsVisited || 0}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-xs text-gray-600">Barbers Visited</p>
                      <p className="text-xl font-bold">{userDetails.stats.barbersVisited || 0}</p>
                    </div>
                  </>
                )}
                {userDetails.user.role === 'Worker' && (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">Total Appointments</p>
                      <p className="text-xl font-bold">{userDetails.stats.totalAppointments || 0}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="text-xl font-bold">{userDetails.stats.completedAppointments || 0}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Salons Worked With</p>
                      <p className="text-xl font-bold">{userDetails.stats.salonsWorkedWith || 0}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-xs text-gray-600">Total Earned</p>
                      <p className="text-xl font-bold">{formatCurrency(userDetails.stats.totalEarned || 0)}</p>
                    </div>
                  </>
                )}
                {userDetails.user.role === 'Owner' && (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">Current Plan</p>
                      <p className="text-xl font-bold capitalize">{userDetails.stats.currentPlan || 'Trial'}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Total Workers</p>
                      <p className="text-xl font-bold">{userDetails.stats.totalWorkers || 0}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600">Active Workers</p>
                      <p className="text-xl font-bold">{userDetails.stats.activeWorkers || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* User History */}
            {userDetails.history && userDetails.history.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <History size={18} />
                  Activity History
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userDetails.history.map((item, index) => (
                    <div key={item._id || index} className="text-sm p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.relatedEntity && (
                            <p className="text-xs text-gray-500 mt-1">
                              Related: {item.relatedEntity.name || item.relatedEntity.type}
                            </p>
                          )}
                          {item.metadata && Object.keys(item.metadata).length > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Appointments */}
            {userDetails.recentAppointments && userDetails.recentAppointments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recent Appointments</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userDetails.recentAppointments.map((apt) => (
                    <div key={apt._id} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span>{apt.serviceId?.name || 'Service'}</span>
                        <span className="text-gray-600">{formatDate(apt.dateTime)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export default UsersPage




