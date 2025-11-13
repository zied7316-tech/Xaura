import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { salonService } from '../../services/salonService'
import { uploadService } from '../../services/uploadService'
import { useForm } from 'react-hook-form'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import ImageUpload from '../../components/ui/ImageUpload'
import QRCodeDisplay from '../../components/salon/QRCodeDisplay'
import toast from 'react-hot-toast'
import { DAYS_OF_WEEK } from '../../utils/constants'

const SalonSettings = () => {
  const { user, salon } = useAuth() // Get salon from account!
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedLogo, setSelectedLogo] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    // Load salon data into form if it exists
    if (salon) {
      setValue('name', salon.name || '')
      setValue('description', salon.description || '')
      setValue('phone', salon.phone || '')
      setValue('email', salon.email || '')
      setValue('address.street', salon.address?.street || '')
      setValue('address.city', salon.address?.city || '')
      setValue('address.state', salon.address?.state || '')
      setValue('address.zipCode', salon.address?.zipCode || '')
      setValue('address.country', salon.address?.country || '')
    }
    setLoading(false)
  }, [salon, setValue])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (salon) {
        // Update existing salon
        await salonService.updateSalon(salon._id, data)
        
        // Upload logo if selected
        if (selectedLogo) {
          try {
            await uploadService.uploadSalonImage(salon._id, selectedLogo)
            toast.success('Salon logo updated!')
          } catch (error) {
            console.error('Logo upload failed:', error)
          }
        }
        
        toast.success('Salon updated successfully!')
      } else {
        // Create new salon
        const newSalon = await salonService.createSalon(data)
        
        // Upload logo if selected
        if (selectedLogo && newSalon._id) {
          try {
            await uploadService.uploadSalonImage(newSalon._id, selectedLogo)
          } catch (error) {
            console.error('Logo upload failed:', error)
          }
        }
        
        toast.success('🎉 Salon created successfully! Refreshing...')
        
        // Refresh the page to load the new salon data
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save salon')
    } finally {
      setSaving(false)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Salon Settings</h1>
        <p className="text-gray-600 mt-1">
          {salon ? `Manage ${salon.name}` : 'Manage your salon information and QR code'}
        </p>
      </div>

      {/* Salon Info Card */}
      {salon && (
        <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-primary-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-2xl font-bold">{salon.name?.charAt(0) || 'S'}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{salon.name}</h3>
                <p className="text-gray-600">{salon.description || 'No description'}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-gray-600">📞 {salon.phone}</span>
                  {salon.email && <span className="text-gray-600">📧 {salon.email}</span>}
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    salon.operatingMode === 'solo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {salon.operatingMode === 'solo' ? '👤 Solo Mode' : '👥 Team Mode'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salon Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{salon ? 'Update' : 'Create'} Salon Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Salon Logo Upload */}
                <ImageUpload
                  label="Salon Logo"
                  currentImage={salon?.logo ? uploadService.getImageUrl(salon.logo) : null}
                  onImageSelect={setSelectedLogo}
                  accept="image/*"
                  maxSize={5}
                />

                {/* Salon Name - Editable ONLY when creating, read-only after */}
                {salon ? (
                  // Read-only for existing salon
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salon Name
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 font-semibold">
                      {salon.name}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ℹ️ Salon name cannot be changed after creation
                    </p>
                  </div>
                ) : (
                  // Editable for new salon
                  <Input
                    label="Salon Name *"
                    placeholder="My Barbershop"
                    error={errors.name?.message}
                    {...register('name', { 
                      required: 'Salon name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                  />
                )}

                {/* Description */}
                {salon ? (
                  // Read-only for existing salon
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 min-h-[80px]">
                      {salon.description || 'No description'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ℹ️ Description cannot be changed after creation
                    </p>
                  </div>
                ) : (
                  // Editable for new salon
                  <Textarea
                    label="Description"
                    placeholder="Tell customers about your salon..."
                    rows={3}
                    {...register('description')}
                  />
                )}

                {/* Editable Fields */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    📞 Editable Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+1234567890"
                      error={errors.phone?.message}
                      {...register('phone', { required: 'Phone is required' })}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="salon@example.com"
                      {...register('email')}
                    />
                  </div>
                </div>

                {/* Address Section */}
                {salon ? (
                  // Read-only address for existing salon
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">Address</h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-600">
                      <p>{salon.address?.street || 'No street'}</p>
                      <p>{salon.address?.city || 'No city'}, {salon.address?.state || 'No state'} {salon.address?.zipCode || ''}</p>
                      <p>{salon.address?.country || 'No country'}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ℹ️ Address cannot be changed. Contact support if you need to update this.
                    </p>
                  </div>
                ) : (
                  // Editable address for new salon
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Address *</h3>
                    
                    <Input
                      label="Street Address"
                      placeholder="123 Main Street"
                      error={errors.address?.street?.message}
                      {...register('address.street', { required: 'Street address is required' })}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        placeholder="New York"
                        error={errors.address?.city?.message}
                        {...register('address.city', { required: 'City is required' })}
                      />
                      
                      <Input
                        label="State/Province"
                        placeholder="NY"
                        error={errors.address?.state?.message}
                        {...register('address.state', { required: 'State is required' })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="ZIP/Postal Code"
                        placeholder="10001"
                        error={errors.address?.zipCode?.message}
                        {...register('address.zipCode', { required: 'ZIP code is required' })}
                      />
                      
                      <Input
                        label="Country"
                        placeholder="USA"
                        error={errors.address?.country?.message}
                        {...register('address.country', { required: 'Country is required' })}
                      />
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" loading={saving}>
                    {salon ? 'Update Contact Information' : '🚀 Create Salon'}
                  </Button>
                  {salon && (
                    <Button type="button" variant="outline" onClick={() => {
                      setValue('phone', salon?.phone || '')
                      setValue('email', salon?.email || '')
                    }}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* QR Code */}
        <div>
          {salon && (
            <Card>
              <CardHeader>
                <CardTitle>QR Code</CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeDisplay salonId={salon._id} qrCode={salon.qrCode} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default SalonSettings

