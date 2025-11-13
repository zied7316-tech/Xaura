import { useState, useEffect } from 'react'
import { superAdminService } from '../../services/superAdminService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Store, Users, Calendar, DollarSign, CheckCircle, XCircle, Mail, Phone } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const SalonManagementPage = () => {
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSalons()
  }, [])

  const loadSalons = async () => {
    try {
      const data = await superAdminService.getAllSalons()
      setSalons(data.data || [])
    } catch (error) {
      console.error('Error loading salons:', error)
      toast.error('Failed to load salons')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (salonId, currentStatus) => {
    const action = currentStatus ? 'suspend' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this salon?`)) return

    try {
      await superAdminService.updateSalonStatus(salonId, !currentStatus)
      toast.success(`Salon ${action}d successfully`)
      loadSalons()
    } catch (error) {
      toast.error(`Failed to ${action} salon`)
    }
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Salon Management</h1>
        <p className="text-gray-600 mt-1">Manage all salons on the Xaura platform</p>
      </div>

      {/* Salons List */}
      <div className="space-y-4">
        {salons.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Store className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600">No salons registered yet</p>
            </div>
          </Card>
        ) : (
          salons.map((salon) => (
            <Card key={salon._id} className={!salon.isActive ? 'bg-gray-50 opacity-75' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Store className="text-primary-600" size={32} />
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{salon.name}</h3>
                        <p className="text-sm text-gray-600">{salon.address?.city}, {salon.address?.state}</p>
                      </div>
                      <Badge variant={salon.isActive ? 'success' : 'danger'}>
                        {salon.isActive ? 'Active' : 'Suspended'}
                      </Badge>
                      {salon.subscription && (
                        <Badge variant="warning">
                          {salon.subscription.plan}
                        </Badge>
                      )}
                    </div>

                    {/* Owner Info */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Owner Information:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Name:</span> {salon.ownerId?.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail size={14} />
                          {salon.ownerId?.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone size={14} />
                          {salon.ownerId?.phone}
                        </div>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Users className="mx-auto text-blue-600 mb-1" size={20} />
                        <p className="text-2xl font-bold text-gray-900">{salon.stats.workers}</p>
                        <p className="text-xs text-gray-600">Workers</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Calendar className="mx-auto text-purple-600 mb-1" size={20} />
                        <p className="text-2xl font-bold text-gray-900">{salon.stats.appointments}</p>
                        <p className="text-xs text-gray-600">Appointments</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="mx-auto text-green-600 mb-1" size={20} />
                        <p className="text-2xl font-bold text-gray-900">{salon.stats.completed}</p>
                        <p className="text-xs text-gray-600">Completed</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <DollarSign className="mx-auto text-yellow-600 mb-1" size={20} />
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(salon.stats.revenue)}</p>
                        <p className="text-xs text-gray-600">Revenue</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      Created: {formatDate(salon.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={salon.isActive ? 'outline' : 'primary'}
                      onClick={() => handleToggleStatus(salon._id, salon.isActive)}
                      className={salon.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}
                    >
                      {salon.isActive ? (
                        <>
                          <XCircle size={16} />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default SalonManagementPage




