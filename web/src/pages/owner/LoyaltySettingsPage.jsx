import { useState, useEffect } from 'react'
import { loyaltyService } from '../../services/loyaltyService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import { 
  Award, Star, Gift, DollarSign, Users, TrendingUp,
  Plus, Edit, Trash2, CheckCircle, Settings
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const LoyaltySettingsPage = () => {
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingReward, setEditingReward] = useState(null)
  const [showRewardModal, setShowRewardModal] = useState(false)

  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsCost: 0,
    discountAmount: 0,
    discountPercentage: 0
  })

  useEffect(() => {
    loadProgram()
  }, [])

  const loadProgram = async () => {
    try {
      setLoading(true)
      const response = await loyaltyService.getLoyaltyProgram()
      // API interceptor already unwraps response.data, so response is { success, data }
      console.log('Loyalty program response:', response)
      if (response && response.data) {
        setProgram(response.data)
      } else {
        console.warn('Unexpected response structure:', response)
        toast.error('Invalid response from server')
      }
    } catch (error) {
      console.error('Error loading loyalty program:', error)
      console.error('Error details:', error.response || error.message)
      toast.error(error.message || 'Failed to load loyalty program')
      setProgram(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Ensure tier names are fixed before saving
      const tierNames = {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum'
      }
      
      const programToSave = { ...program }
      if (programToSave.tiers) {
        Object.keys(programToSave.tiers).forEach(tierKey => {
          if (tierNames[tierKey]) {
            programToSave.tiers[tierKey].name = tierNames[tierKey]
          }
        })
      }
      
      const response = await loyaltyService.updateLoyaltyProgram(programToSave)
      // API interceptor already unwraps response.data, so response is { success, data, message }
      toast.success(response.message || 'Loyalty program updated successfully!')
      // Reload program to get latest data
      await loadProgram()
    } catch (error) {
      console.error('Error saving loyalty program:', error)
      toast.error(error.message || 'Failed to save loyalty program')
    } finally {
      setSaving(false)
    }
  }

  const handleAddReward = () => {
    setEditingReward(null)
    setRewardForm({ name: '', description: '', pointsCost: 0, discountAmount: 0, discountPercentage: 0 })
    setShowRewardModal(true)
  }

  const handleSaveReward = () => {
    if (!rewardForm.name || rewardForm.pointsCost <= 0) {
      toast.error('Please enter reward name and points cost')
      return
    }

    if (!program) return

    const newRewards = [...(program.rewards || [])]
    if (editingReward !== null) {
      newRewards[editingReward] = { ...rewardForm, isActive: true }
    } else {
      newRewards.push({ ...rewardForm, isActive: true })
    }

    setProgram({ ...program, rewards: newRewards })
    setShowRewardModal(false)
    toast.success('Reward saved! Remember to click "Save Settings"')
  }

  const handleDeleteReward = (index) => {
    if (!confirm('Delete this reward?')) return
    if (!program || !program.rewards) return
    
    const newRewards = program.rewards.filter((_, i) => i !== index)
    setProgram({ ...program, rewards: newRewards })
    toast.success('Reward deleted! Remember to click "Save Settings"')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load loyalty program</p>
          <Button onClick={loadProgram}>Retry</Button>
        </div>
      </div>
    )
  }

  // Ensure program has required properties with defaults
  const safeProgram = {
    isEnabled: program.isEnabled !== undefined ? program.isEnabled : true,
    pointsPerDollar: program.pointsPerDollar !== undefined ? program.pointsPerDollar : 1,
    pointsExpireDays: program.pointsExpireDays !== undefined ? program.pointsExpireDays : 365,
    bonusPointsFirstVisit: program.bonusPointsFirstVisit !== undefined ? program.bonusPointsFirstVisit : 50,
    bonusPointsBirthday: program.bonusPointsBirthday !== undefined ? program.bonusPointsBirthday : 100,
    bonusPointsReferral: program.bonusPointsReferral !== undefined ? program.bonusPointsReferral : 200,
    tiers: program.tiers || {
      bronze: { name: 'Bronze', minPoints: 0, discountPercentage: 0, benefits: [] },
      silver: { name: 'Silver', minPoints: 500, discountPercentage: 5, benefits: [] },
      gold: { name: 'Gold', minPoints: 1000, discountPercentage: 10, benefits: [] },
      platinum: { name: 'Platinum', minPoints: 2000, discountPercentage: 15, benefits: [] }
    },
    rewards: program.rewards || [],
    ...program
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loyalty & Rewards Program</h1>
          <p className="text-gray-600 mt-1">Reward loyal customers and increase retention</p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <CheckCircle size={18} />
          Save Settings
        </Button>
      </div>

      {/* Program Status */}
      <Card className={safeProgram.isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50'}>
        <CardContent className="p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Award className={safeProgram.isEnabled ? 'text-green-600' : 'text-gray-400'} size={32} />
              <div>
                <p className="font-semibold text-gray-900">Loyalty Program Status</p>
                <p className="text-sm text-gray-600">
                  {safeProgram.isEnabled ? '🟢 Active - Clients are earning points!' : '⚪ Disabled - No points being awarded'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={safeProgram.isEnabled}
              onChange={(e) => setProgram({ ...program, isEnabled: e.target.checked })}
              className="w-6 h-6 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </label>
        </CardContent>
      </Card>

      {/* Points Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="text-yellow-500" />
            Points Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Points Per Dollar Spent"
              type="number"
              min="0"
              step="0.1"
              value={safeProgram.pointsPerDollar}
              onChange={(e) => setProgram({ ...program, pointsPerDollar: parseFloat(e.target.value) || 0 })}
              helperText="e.g., 1 = clients earn 1 point per $1 spent"
            />
            <Input
              label="Points Expiry (Days)"
              type="number"
              min="0"
              value={safeProgram.pointsExpireDays}
              onChange={(e) => setProgram({ ...program, pointsExpireDays: parseInt(e.target.value) || 365 })}
              helperText="0 = never expire"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="First Visit Bonus"
              type="number"
              min="0"
              value={safeProgram.bonusPointsFirstVisit}
              onChange={(e) => setProgram({ ...program, bonusPointsFirstVisit: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Birthday Bonus"
              type="number"
              min="0"
              value={safeProgram.bonusPointsBirthday}
              onChange={(e) => setProgram({ ...program, bonusPointsBirthday: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Referral Bonus"
              type="number"
              min="0"
              value={safeProgram.bonusPointsReferral}
              onChange={(e) => setProgram({ ...program, bonusPointsReferral: parseInt(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Membership Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-primary-600" />
            Membership Tiers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['bronze', 'silver', 'gold', 'platinum'].map((tierKey) => {
            const tier = safeProgram.tiers[tierKey] || { name: tierKey, minPoints: 0, discountPercentage: 0, benefits: [] }
            const colors = {
              bronze: 'bg-orange-100 border-orange-300 text-orange-900',
              silver: 'bg-gray-100 border-gray-300 text-gray-900',
              gold: 'bg-yellow-100 border-yellow-300 text-yellow-900',
              platinum: 'bg-purple-100 border-purple-300 text-purple-900'
            }

            // Fixed tier names mapping
            const tierNames = {
              bronze: 'Bronze',
              silver: 'Silver',
              gold: 'Gold',
              platinum: 'Platinum'
            }

            return (
              <div key={tierKey} className={`border-2 rounded-lg p-4 ${colors[tierKey]}`}>
                <div className="mb-3">
                  <h3 className="text-lg font-bold capitalize">{tierNames[tierKey]}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Minimum Points Required"
                    type="number"
                    min="0"
                    value={tier.minPoints}
                    onChange={(e) => setProgram({
                      ...program,
                      tiers: {
                        ...(program.tiers || {}),
                        [tierKey]: { ...tier, name: tierNames[tierKey], minPoints: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                  <Input
                    label="Discount Percentage (%)"
                    type="number"
                    min="0"
                    max="100"
                    value={tier.discountPercentage}
                    onChange={(e) => setProgram({
                      ...program,
                      tiers: {
                        ...(program.tiers || {}),
                        [tierKey]: { ...tier, name: tierNames[tierKey], discountPercentage: parseInt(e.target.value) || 0 }
                      }
                    })}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Rewards Catalog */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gift className="text-pink-600" />
              Rewards Catalog
            </CardTitle>
            <Button size="sm" onClick={handleAddReward}>
              <Plus size={16} />
              Add Reward
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!safeProgram.rewards || safeProgram.rewards.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-600">No rewards yet</p>
              <Button size="sm" onClick={handleAddReward} className="mt-4">
                <Plus size={16} />
                Add First Reward
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeProgram.rewards.map((reward, index) => (
                <div key={index} className="border-2 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Gift className="text-pink-600" size={24} />
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingReward(index)
                          setRewardForm(reward)
                          setShowRewardModal(true)
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">{reward.pointsCost} pts</span>
                    {reward.discountAmount > 0 && (
                      <span className="text-green-600 font-semibold">{formatCurrency(reward.discountAmount)} off</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingReward !== null ? 'Edit Reward' : 'Add New Reward'}
            </h2>
            <div className="space-y-4">
              <Input
                label="Reward Name"
                required
                value={rewardForm.name}
                onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                placeholder="e.g., $10 Off Next Visit"
              />
              <Textarea
                label="Description"
                rows={2}
                value={rewardForm.description}
                onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                placeholder="Describe the reward..."
              />
              <Input
                label="Points Cost"
                type="number"
                min="0"
                required
                value={rewardForm.pointsCost}
                onChange={(e) => setRewardForm({ ...rewardForm, pointsCost: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Discount Amount ($)"
                type="number"
                min="0"
                step="0.01"
                value={rewardForm.discountAmount}
                onChange={(e) => setRewardForm({ ...rewardForm, discountAmount: parseFloat(e.target.value) || 0 })}
                helperText="For dollar-off rewards"
              />
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSaveReward} fullWidth>
                  <CheckCircle size={16} />
                  {editingReward !== null ? 'Update' : 'Add'} Reward
                </Button>
                <Button variant="outline" onClick={() => setShowRewardModal(false)} fullWidth>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoyaltySettingsPage




