import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { serviceService } from '../../services/serviceService'
import { uploadService } from '../../services/uploadService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import ImageUpload from '../../components/ui/ImageUpload'
import SafeImage from '../../components/ui/SafeImage'
// Removed ThreeDImageRing import
import { Plus, Edit, Trash2, Scissors, Clock, DollarSign, Tag } from 'lucide-react'
import { formatCurrency, formatDuration } from '../../utils/helpers'
import { SERVICE_CATEGORIES } from '../../utils/constants'
import toast from 'react-hot-toast'

const ServicesPage = () => {
  const { salon } = useAuth()
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    category: 'Other'
  })

  useEffect(() => {
    loadServices()
  }, [salon])

  const loadServices = async () => {
    if (!salon?._id) return
    
    try {
      const data = await serviceService.getAllServices({ salonId: salon._id })
      setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: '',
      price: '',
      category: 'Other'
    })
    setSelectedImage(null)
  }

  const handleAddService = async (e) => {
    e.preventDefault()
    
    if (!salon?._id) {
      toast.error('Please create a salon first')
      return
    }

    if (!formData.name || !formData.duration || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const newService = await serviceService.createService({
        ...formData,
        salonId: salon._id,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price)
      })
      
      // Upload image if selected
      if (selectedImage && newService._id) {
        try {
          await uploadService.uploadServiceImage(newService._id, selectedImage)
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }
      
      toast.success('Service created successfully!')
      setShowAddModal(false)
      resetForm()
      loadServices()
    } catch (error) {
      toast.error(error.message || 'Failed to create service')
    }
  }

  const handleEditService = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.duration || !formData.price) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await serviceService.updateService(selectedService._id, {
        name: formData.name,
        description: formData.description,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        category: formData.category
      })
      
      // Upload new image if selected
      if (selectedImage) {
        try {
          await uploadService.uploadServiceImage(selectedService._id, selectedImage)
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }
      
      toast.success('Service updated successfully!')
      setShowEditModal(false)
      resetForm()
      setSelectedService(null)
      loadServices()
    } catch (error) {
      toast.error(error.message || 'Failed to update service')
    }
  }

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    
    try {
      await serviceService.deleteService(serviceId)
      toast.success('Service deleted successfully')
      loadServices()
    } catch (error) {
      toast.error(error.message || 'Failed to delete service')
    }
  }

  const openEditModal = (service) => {
    setSelectedService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      category: service.category
    })
    setSelectedImage(null)
    setShowEditModal(true)
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const categoryOptions = SERVICE_CATEGORIES.map(cat => ({
    value: cat,
    label: cat
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-1">Create and manage your salon's services</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={20} />
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <Scissors className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Services Yet</h3>
          <p className="text-gray-600 mb-4">
            Add your first service to start accepting bookings
          </p>
          <Button onClick={openAddModal}>
            <Plus size={20} />
            Add First Service
          </Button>
        </Card>
      ) : (
        <>
          {/* 3D Image Ring removed - no longer displaying */}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
            <Card key={service._id}>
              <CardContent className="p-0">
                {/* Service Image */}
                <div className="h-40 w-full overflow-hidden rounded-t-lg">
                  <SafeImage
                    src={service.image ? uploadService.getImageUrl(service.image) : null}
                    alt={service.name}
                    className="w-full h-full"
                    fallbackType="service"
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {service.name}
                      </h3>
                      <Badge variant="default">
                        <Tag size={12} className="mr-1" />
                        {service.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service._id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      Estimation
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatDuration(service.duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} />
                      Price
                    </span>
                    <span className="font-semibold text-green-600 text-lg">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </>
      )}

      {/* Add Service Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Service"
        size="md"
      >
        <form onSubmit={handleAddService} className="space-y-4">
          <ImageUpload
            label="Service Image (Optional)"
            onImageSelect={setSelectedImage}
            accept="image/*"
            maxSize={5}
          />

          <Input
            label="Service Name"
            placeholder="e.g., Haircut & Styling"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Textarea
            label="Description"
            placeholder="Describe this service..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Time (minutes)"
              type="number"
              placeholder="60"
              required
              min="5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />

            <Input
              label="Price"
              type="number"
              placeholder="50.00"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categoryOptions}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>
              Create Service
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              fullWidth
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          resetForm()
          setSelectedService(null)
        }}
        title="Edit Service"
        size="md"
      >
        <form onSubmit={handleEditService} className="space-y-4">
          <ImageUpload
            label="Service Image (Optional)"
            currentImage={selectedService?.image ? uploadService.getImageUrl(selectedService.image) : null}
            onImageSelect={setSelectedImage}
            accept="image/*"
            maxSize={5}
          />

          <Input
            label="Service Name"
            placeholder="e.g., Haircut & Styling"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Textarea
            label="Description"
            placeholder="Describe this service..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Estimated Time (minutes)"
              type="number"
              placeholder="60"
              required
              min="5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            />

            <Input
              label="Price"
              type="number"
              placeholder="50.00"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categoryOptions}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>
              Update Service
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              fullWidth
              onClick={() => {
                setShowEditModal(false)
                resetForm()
                setSelectedService(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default ServicesPage

