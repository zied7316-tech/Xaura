import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { salonAccountService } from '../../services/salonAccountService'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Card from '../../components/ui/Card'
import { Store, User, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import LanguageSwitcher from '../../components/layout/LanguageSwitcher'

const RegisterSalonPage = () => {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Salon Details (Step 1)
  const [salonData, setSalonData] = useState({
    salonName: '',
    salonDescription: '',
    salonPhone: '',
    salonEmail: '',
    operatingMode: 'solo',
    salonType: 'unisex',
    salonAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  // Owner Credentials (Step 2)
  const [ownerData, setOwnerData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    ownerPhone: ''
  })

  const handleNext = () => {
    // Validate step 1
    if (!salonData.salonName || !salonData.salonPhone) {
      toast.error('Please fill in all required salon fields')
      return
    }
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate step 2
    if (!ownerData.ownerName || !ownerData.ownerEmail || !ownerData.ownerPassword || !ownerData.ownerPhone) {
      toast.error('Please fill in all owner credentials')
      return
    }

    setLoading(true)
    
    try {
      const result = await salonAccountService.createSalonAccount({
        ...salonData,
        ...ownerData
      })

      if (result.success) {
        updateUser(result.owner)
        toast.success(`Welcome to Xaura! ${result.salon.name} is now live!`)
        navigate('/owner/dashboard')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create salon account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? <Check size={20} /> : '1'}
              </div>
              <span className="font-medium">Salon Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Owner Account</span>
            </div>
          </div>
        </div>

        <Card className="p-8">
          {/* Step 1: Salon Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <Store className="text-primary-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold">Create Your Business Account</h2>
                <p className="text-gray-600 mt-2">First, let's set up your salon business</p>
              </div>

              <Input
                label="Salon Name"
                placeholder="Elegant Beauty Salon"
                required
                value={salonData.salonName}
                onChange={(e) => setSalonData({ ...salonData, salonName: e.target.value })}
              />

              <Textarea
                label="Description"
                placeholder="Tell clients about your salon..."
                rows={3}
                value={salonData.salonDescription}
                onChange={(e) => setSalonData({ ...salonData, salonDescription: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Salon Phone"
                  type="tel"
                  placeholder="+1234567890"
                  required
                  value={salonData.salonPhone}
                  onChange={(e) => setSalonData({ ...salonData, salonPhone: e.target.value })}
                />

                <Input
                  label="Salon Email"
                  type="email"
                  placeholder="info@salon.com"
                  value={salonData.salonEmail}
                  onChange={(e) => setSalonData({ ...salonData, salonEmail: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Operating Mode"
                  value={salonData.operatingMode}
                  onChange={(e) => setSalonData({ ...salonData, operatingMode: e.target.value })}
                  options={[
                    { value: 'solo', label: 'Solo Mode - I work alone' },
                    { value: 'team', label: 'Team Mode - I have workers' }
                  ]}
                />

                <Select
                  label="Business Type"
                  value={salonData.salonType}
                  onChange={(e) => setSalonData({ ...salonData, salonType: e.target.value })}
                  options={[
                    { value: 'men', label: 'Men\'s Salon / Barber' },
                    { value: 'women', label: 'Women\'s Salon' },
                    { value: 'nails', label: 'Nail Salon' },
                    { value: 'massage', label: 'Massage Centre' },
                    { value: 'spa', label: 'Spa / Wellness Center' },
                    { value: 'unisex', label: 'Unisex / Mixed' }
                  ]}
                />
              </div>

              <Input
                label="Street Address"
                placeholder="123 Main St"
                value={salonData.salonAddress.street}
                onChange={(e) => setSalonData({
                  ...salonData,
                  salonAddress: { ...salonData.salonAddress, street: e.target.value }
                })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="New York"
                  value={salonData.salonAddress.city}
                  onChange={(e) => setSalonData({
                    ...salonData,
                    salonAddress: { ...salonData.salonAddress, city: e.target.value }
                  })}
                />

                <Input
                  label="State"
                  placeholder="NY"
                  value={salonData.salonAddress.state}
                  onChange={(e) => setSalonData({
                    ...salonData,
                    salonAddress: { ...salonData.salonAddress, state: e.target.value }
                  })}
                />
              </div>

              <Button onClick={handleNext} fullWidth>
                Next: Owner Account
                <ArrowRight size={20} />
              </Button>
            </div>
          )}

          {/* Step 2: Owner Credentials */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <User className="text-blue-600" size={32} />
                </div>
                <h2 className="text-2xl font-bold">Create Owner Account</h2>
                <p className="text-gray-600 mt-2">
                  You'll manage <strong>{salonData.salonName}</strong> with this account
                </p>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-sm text-primary-800">
                <strong>Note:</strong> This account will be the admin/manager of your salon business.
                You'll have full control over all salon operations.
              </div>

              <Input
                label="Your Full Name"
                placeholder="John Doe"
                required
                value={ownerData.ownerName}
                onChange={(e) => setOwnerData({ ...ownerData, ownerName: e.target.value })}
              />

              <Input
                label="Your Email"
                type="email"
                placeholder="owner@example.com"
                required
                value={ownerData.ownerEmail}
                onChange={(e) => setOwnerData({ ...ownerData, ownerEmail: e.target.value })}
              />

              <Input
                label="Your Phone"
                type="tel"
                placeholder="+1234567890"
                required
                value={ownerData.ownerPhone}
                onChange={(e) => setOwnerData({ ...ownerData, ownerPhone: e.target.value })}
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create a secure password"
                required
                value={ownerData.ownerPassword}
                onChange={(e) => setOwnerData({ ...ownerData, ownerPassword: e.target.value })}
              />

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} fullWidth>
                  <ArrowLeft size={20} />
                  Back
                </Button>
                <Button onClick={handleSubmit} fullWidth loading={loading}>
                  Create Business Account
                  <Check size={20} />
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have a business account?{' '}
            <button onClick={() => navigate('/login')} className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterSalonPage

