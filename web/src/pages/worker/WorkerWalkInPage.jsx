import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonService } from '../../services/salonService'
import { appointmentManagementService } from '../../services/appointmentManagementService'
import { saveToQueue, getQueueCount, isOnline, onOnlineStatusChange } from '../../utils/offlineStorage'
import { syncQueue, startAutoSync, setupOnlineListener } from '../../utils/offlineSync'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import toast from 'react-hot-toast'
import { UserPlus, DollarSign, Calendar, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const WorkerWalkInPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [online, setOnline] = useState(navigator.onLine)
  const [queueCount, setQueueCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '', // Client ID if they have an account
    clientName: '', // Optional
    clientPhone: '', // Optional
    serviceId: '',
    price: '',
    paymentStatus: 'paid',
    paymentMethod: 'cash'
  })

  useEffect(() => {
    loadServices()
    setupOnlineListener()
    startAutoSync()
    updateQueueCount()
    
    // Listen for online/offline changes
    const handleOnlineChange = (isOnline) => {
      setOnline(isOnline)
      if (isOnline) {
        updateQueueCount()
        syncQueue().then(() => updateQueueCount())
      }
    }
    onOnlineStatusChange(handleOnlineChange)

    // Update queue count every 5 seconds
    const interval = setInterval(updateQueueCount, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const updateQueueCount = async () => {
    const count = await getQueueCount()
    setQueueCount(count)
  }

  const handleManualSync = async () => {
    if (!online) {
      toast.error('You are offline. Cannot sync.')
      return
    }
    setSyncing(true)
    try {
      const result = await syncQueue()
      if (result.synced > 0) {
        toast.success(`✅ Synced ${result.synced} walk-in(s)`)
      }
      if (result.failed > 0) {
        toast.error(`⚠️ ${result.failed} failed to sync`)
      }
      if (result.total === 0) {
        toast.success('✅ Queue is empty')
      }
      updateQueueCount()
    } catch (error) {
      toast.error('Failed to sync: ' + error.message)
    } finally {
      setSyncing(false)
    }
  }

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

      // Include clientId if provided (client has account)
      if (formData.clientId) {
        appointmentData.clientId = formData.clientId;
      }

      // Only include client info if provided (optional fields)
      if (formData.clientName) appointmentData.clientName = formData.clientName;
      if (formData.clientPhone) appointmentData.clientPhone = formData.clientPhone;

      // Check if online
      if (online && navigator.onLine) {
        // Try to send to server with timeout wrapper
        try {
          // Create a timeout promise (15 seconds - faster than API timeout)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TIMEOUT')), 15000)
          )

          // Race between API call and timeout
          const result = await Promise.race([
            appointmentManagementService.createWalkInAppointment(appointmentData),
            timeoutPromise
          ])

          if (result && result.success) {
            toast.success('Walk-in client added successfully!')
            // Reset form
            setFormData({
              clientId: '',
              clientName: '',
              clientPhone: '',
              serviceId: '',
              price: '',
              paymentStatus: 'paid',
              paymentMethod: 'cash'
            })
            updateQueueCount()
            return // Success - exit early
          }
        } catch (error) {
          // Check if it's a timeout or network error
          const isTimeout = error.message === 'TIMEOUT' || 
                           error.message?.includes('timeout') || 
                           error.message?.includes('timed out') ||
                           error.code === 'ECONNABORTED'
          
          const isNetworkError = !navigator.onLine || 
                                error.message?.includes('network') ||
                                error.message?.includes('connection') ||
                                error.message?.includes('Failed to fetch')

          // If timeout or network error, save to offline queue
          if (isTimeout || isNetworkError) {
            console.log('📴 Timeout or network error - saving to queue:', error.message)
            try {
              await saveToQueue(appointmentData)
              toast.success('✅ Saved! Will sync when online', {
                icon: '📦',
                duration: 4000
              })
              updateQueueCount()
              // Reset form
              setFormData({
                clientId: '',
                clientName: '',
                clientPhone: '',
                serviceId: '',
                price: '',
                paymentStatus: 'paid',
                paymentMethod: 'cash'
              })
              return // Saved to queue - exit
            } catch (queueError) {
              console.error('Failed to save to queue:', queueError)
              toast.error('Failed to save. Please try again.')
              return
            }
          } else {
            // Other error - show error message
            console.error('Error creating walk-in appointment:', error)
            toast.error(error.response?.data?.message || error.message || 'Failed to add walk-in client')
            return
          }
        }
      } else {
        // Offline - save to queue
        await saveToQueue(appointmentData)
        toast.success('✅ Saved offline! Will sync when online', {
          icon: '📦',
          duration: 4000
        })
        updateQueueCount()
        // Reset form
        setFormData({
          clientId: '',
          clientName: '',
          clientPhone: '',
          serviceId: '',
          price: '',
          paymentStatus: 'paid',
          paymentMethod: 'cash'
        })
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

        {/* Status Banner */}
        <div className="mb-6 space-y-3">
          {/* Online/Offline Status */}
          <Card className={online ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {online ? (
                  <Wifi className="text-green-600" size={20} />
                ) : (
                  <WifiOff className="text-yellow-600" size={20} />
                )}
                <div className="text-sm">
                  <p className="font-semibold">
                    {online ? '🌐 Online' : '📴 Offline'}
                  </p>
                  <p className="text-gray-600">
                    {online 
                      ? 'Walk-ins will sync immediately' 
                      : 'Walk-ins will be saved and synced when online'}
                  </p>
                </div>
              </div>
              {queueCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    📦 {queueCount} pending
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualSync}
                    loading={syncing}
                    disabled={!online || syncing}
                  >
                    <RefreshCw size={16} />
                    Sync
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Info Banner */}
          <Card className="bg-green-50 border-green-200">
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
        </div>

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
              
              {/* Client ID - if they have an account */}
              <div className="mb-4">
                <Input
                  label="Client ID (If they have an account)"
                  placeholder="Enter client ID"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 If client has an account, enter their ID. Otherwise, use name/phone below.
                </p>
              </div>

              {/* Name and Phone - Optional */}
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
              <p className="text-xs text-gray-500 mt-2">
                💡 If phone provided, we'll link to existing client or create new account
              </p>
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

