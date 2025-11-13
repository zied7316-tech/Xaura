import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { workerService } from '../../services/workerService'
import { salonService } from '../../services/salonService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ImageUpload from '../../components/ui/ImageUpload'
import { UserPlus, Mail, Phone, DollarSign, Edit, Trash2, TrendingUp, Award, Calendar, User } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkersPage = () => {
  const { salon } = useAuth() // Get salon from context!
  const [workers, setWorkers] = useState([])
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [workerEmail, setWorkerEmail] = useState('')
  const [editData, setEditData] = useState(null)
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    try {
      const workersData = await workerService.getWorkers()
      setWorkers(workersData)
    } catch (error) {
      console.error('Error loading workers:', error)
      toast.error('Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = async () => {
    if (!workerEmail) {
      toast.error('Please enter worker email')
      return
    }

    try {
      // For now, we'll use the workers endpoint which doesn't need salon ID
      // The backend gets salon from the owner's account
      
      // Alternative: If salon exists, use that
      if (salon && salon._id) {
        await salonService.addWorker(salon._id, workerEmail)
      } else {
        // Fallback: Worker will be added through direct API
        toast.error('Please create a salon first')
        return
      }
      
      toast.success('Worker added successfully!')
      setShowAddModal(false)
      setWorkerEmail('')
      loadWorkers()
    } catch (error) {
      toast.error(error.message || 'Failed to add worker')
    }
  }

  const handleUpdateWorker = async () => {
    try {
      await workerService.updateWorker(selectedWorker._id, editData)
      
      // Upload avatar if selected
      if (selectedAvatar) {
        try {
          await uploadService.uploadWorkerImage(selectedWorker._id, selectedAvatar)
        } catch (error) {
          console.error('Avatar upload failed:', error)
        }
      }
      
      toast.success('Worker updated successfully!')
      setShowEditModal(false)
      setSelectedAvatar(null)
      loadWorkers()
    } catch (error) {
      toast.error('Failed to update worker')
    }
  }

  const handleRemoveWorker = async (workerId) => {
    if (!confirm('Are you sure you want to remove this worker?')) return
    
    try {
      await workerService.removeWorker(workerId)
      toast.success('Worker removed successfully')
      loadWorkers()
    } catch (error) {
      toast.error(error.message || 'Failed to remove worker')
    }
  }

  const openEditModal = (worker) => {
    setSelectedWorker(worker)
    setEditData({
      name: worker.name,
      phone: worker.phone,
      paymentModel: worker.paymentModel,
      isActive: worker.isActive
    })
    setSelectedAvatar(null)
    setShowEditModal(true)
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
          <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
          <p className="text-gray-600 mt-1">Manage your team members and their performance</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus size={20} />
          Add Worker
        </Button>
      </div>

      {/* Stats */}
      {workers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-4 text-center">
              <Award className="mx-auto text-primary-600 mb-2" size={32} />
              <p className="text-2xl font-bold">{workers.length}</p>
              <p className="text-gray-600">Total Workers</p>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <TrendingUp className="mx-auto text-green-600 mb-2" size={32} />
              <p className="text-2xl font-bold">{workers.filter(w => w.isActive).length}</p>
              <p className="text-gray-600">Active Workers</p>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <Calendar className="mx-auto text-blue-600 mb-2" size={32} />
              <p className="text-2xl font-bold">0</p>
              <p className="text-gray-600">Today's Appointments</p>
            </div>
          </Card>
        </div>
      )}

      {/* Workers List */}
      {workers.length === 0 ? (
        <Card className="p-12 text-center">
          <UserPlus className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Workers Yet</h3>
          <p className="text-gray-600 mb-4">
            Add your first team member to start managing your salon together
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus size={20} />
            Add First Worker
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <Card key={worker._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {/* Worker Avatar */}
                  {worker.avatar ? (
                    <img
                      src={uploadService.getImageUrl(worker.avatar)}
                      alt={worker.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="text-primary-600" size={32} />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{worker.name}</h3>
                        <Badge variant={worker.isActive ? 'success' : 'default'}>
                          {worker.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(worker)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit size={18} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleRemoveWorker(worker._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} />
                    <span>{worker.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{worker.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} />
                    <span className="capitalize">
                      {worker.paymentModel?.type?.replace('_', ' ') || 'Commission'}
                    </span>
                  </div>
                </div>

                {worker.paymentModel?.type && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Payment Details:</p>
                    {worker.paymentModel.type === 'fixed_salary' && (
                      <p className="text-sm text-gray-600">
                        {formatCurrency(worker.paymentModel.fixedSalary)}/month
                      </p>
                    )}
                    {worker.paymentModel.type === 'percentage_commission' && (
                      <p className="text-sm text-gray-600">
                        {worker.paymentModel.commissionPercentage}% commission
                      </p>
                    )}
                    {worker.paymentModel.type === 'hybrid' && (
                      <p className="text-sm text-gray-600">
                        {formatCurrency(worker.paymentModel.baseSalary)} + {worker.paymentModel.commissionPercentage}%
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Worker to Salon"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>Note:</strong> The worker must register first with role "Worker", 
            then you can add them here using their email.
          </div>
          
          <Input
            label="Worker Email"
            type="email"
            placeholder="worker@example.com"
            value={workerEmail}
            onChange={(e) => setWorkerEmail(e.target.value)}
          />

          <div className="flex gap-3">
            <Button onClick={handleAddWorker} fullWidth>
              Add Worker
            </Button>
            <Button variant="outline" onClick={() => setShowAddModal(false)} fullWidth>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Worker Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAvatar(null)
        }}
        title="Edit Worker"
        size="md"
      >
        {editData && (
          <div className="space-y-4">
            <ImageUpload
              label="Worker Profile Picture"
              currentImage={selectedWorker?.avatar ? uploadService.getImageUrl(selectedWorker.avatar) : null}
              onImageSelect={setSelectedAvatar}
              accept="image/*"
              maxSize={5}
            />

            <Input
              label="Name"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />

            <Input
              label="Phone"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
            />

            <Select
              label="Payment Model"
              value={editData.paymentModel?.type || 'percentage_commission'}
              onChange={(e) => setEditData({
                ...editData,
                paymentModel: {
                  ...editData.paymentModel,
                  type: e.target.value
                }
              })}
              options={[
                { value: 'fixed_salary', label: 'Fixed Salary (Monthly)' },
                { value: 'percentage_commission', label: 'Percentage Commission' },
                { value: 'hybrid', label: 'Hybrid (Salary + Commission)' }
              ]}
            />

            {editData.paymentModel?.type === 'fixed_salary' && (
              <Input
                label="Monthly Salary"
                type="number"
                value={editData.paymentModel.fixedSalary || 0}
                onChange={(e) => setEditData({
                  ...editData,
                  paymentModel: {
                    ...editData.paymentModel,
                    fixedSalary: parseFloat(e.target.value)
                  }
                })}
              />
            )}

            {editData.paymentModel?.type === 'percentage_commission' && (
              <Input
                label="Commission Percentage"
                type="number"
                min="0"
                max="100"
                value={editData.paymentModel.commissionPercentage || 50}
                onChange={(e) => setEditData({
                  ...editData,
                  paymentModel: {
                    ...editData.paymentModel,
                    commissionPercentage: parseFloat(e.target.value)
                  }
                })}
              />
            )}

            {editData.paymentModel?.type === 'hybrid' && (
              <>
                <Input
                  label="Base Salary (Monthly)"
                  type="number"
                  value={editData.paymentModel.baseSalary || 0}
                  onChange={(e) => setEditData({
                    ...editData,
                    paymentModel: {
                      ...editData.paymentModel,
                      baseSalary: parseFloat(e.target.value)
                    }
                  })}
                />
                <Input
                  label="Commission Percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={editData.paymentModel.commissionPercentage || 30}
                  onChange={(e) => setEditData({
                    ...editData,
                    paymentModel: {
                      ...editData.paymentModel,
                      commissionPercentage: parseFloat(e.target.value)
                    }
                  })}
                />
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editData.isActive}
                onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm">Active Worker</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleUpdateWorker} fullWidth>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setShowEditModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkersPage

