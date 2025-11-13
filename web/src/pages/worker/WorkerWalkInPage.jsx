import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonService } from '../../services/salonService'
import { appointmentManagementService } from '../../services/appointmentManagementService'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import toast from 'react-hot-toast'
import { UserPlus, DollarSign, Calendar } from 'lucide-react'

const WorkerWalkInPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)

  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    price: '',
    paymentStatus: 'paid',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const data = await salonService.getWorkerServices()
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoadingServices(false)
    }
  }

  const handleServiceChange = (e) => {
    const serviceId = e.target.value
    setFormData({ ...formData, serviceId })

    // Auto-fill price from selected service
    const selectedService = services.find(s => s._id === serviceId)
    if (selectedService) {
      setFormData(prev => ({ ...prev, serviceId, price: selectedService.price }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation - ONLY service and price required!
    if (!formData.serviceId) {
      toast.error('Please select a service')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }

    setLoading(true)

    try {
      const appointmentData = {
        serviceId: formData.serviceId,
        price: parseFloat(formData.price),
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod
      };

      // Only include client info if provided
      if (formData.clientName) appointmentData.clientName = formData.clientName;
      if (formData.clientPhone) appointmentData.clientPhone = formData.clientPhone;
      if (formData.clientEmail) appointmentData.clientEmail = formData.clientEmail;

      const result = await appointmentManagementService.createWalkInAppointment(appointmentData)

      if (result.success) {
        toast.success('Walk-in client added successfully!')
        navigate('/worker/appointments')
      }
    } catch (error) {
      console.error('Error creating walk-in appointment:', error)
      toast.error(error.response?.data?.message || 'Failed to add walk-in client')
    } finally {
      setLoading(false)
    }
  }

  const paymentStatusOptions = [
    { value: 'paid', label: '💵 Client Paid' },
    { value: 'waiting', label: '⏳ Client Will Pay Later' }
  ]

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <UserPlus className="text-primary-600" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add Walk-in Client</h1>
              <p className="text-gray-600 mt-1">Record a service for a client who came without booking</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <Calendar className="text-green-600 mt-1" size={20} />
            <div className="text-sm text-green-800">
              <p className="font-semibold mb-1">⚡ Quick Walk-in Process</p>
              <p>
                <strong>Required:</strong> Just select service & price!<br />
                <strong>Optional:</strong> Add client details if you want to track them.<br />
                Service recorded instantly in your finances.
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information - OPTIONAL */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <UserPlus size={20} />
                Client Information <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Skip this section for quick walk-ins. Add client details if you want to track them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Client Name (Optional)"
                  placeholder="John Doe"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
                <Input
                  label="Phone Number (Optional)"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Email (Optional)"
                  type="email"
                  placeholder="client@example.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 If phone provided, we'll link to existing client or create new account
                </p>
              </div>
            </div>

            <hr />

            {/* Service Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Service & Payment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Service Provided"
                  required
                  disabled={loadingServices}
                  value={formData.serviceId}
                  onChange={handleServiceChange}
                  options={[
                    { value: '', label: loadingServices ? 'Loading services...' : 'Select service' },
                    ...services.map(service => ({
                      value: service._id,
                      label: `${service.name} - $${service.price}`
                    }))
                  ]}
                />
                <Input
                  label="Final Price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Select
                  label="Payment Status"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  options={paymentStatusOptions}
                />
                {formData.paymentStatus === 'paid' && (
                  <Select
                    label="Payment Method"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    options={paymentMethodOptions}
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={loadingServices}
              >
                <UserPlus size={18} />
                Add Walk-in Client
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default WorkerWalkInPage

