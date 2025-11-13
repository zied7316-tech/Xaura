import { useState, useEffect } from 'react'
import { loyaltyService } from '../../services/loyaltyService'
import { salonService } from '../../services/salonService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { 
  Award, Star, Gift, TrendingUp, Calendar, CheckCircle,
  Plus, Minus, Crown
} from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const ClientRewardsPage = () => {
  const [loyaltyData, setLoyaltyData] = useState(null)
  const [joinedSalon, setJoinedSalon] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLoyaltyData()
  }, [])

  const loadLoyaltyData = async () => {
    try {
      // Get client's joined salon
      const salon = await salonService.getJoinedSalon()
      if (salon) {
        setJoinedSalon(salon)
        // Get loyalty points
        const data = await loyaltyService.getMyLoyaltyPoints(salon._id)
        setLoyaltyData(data.data)
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (rewardId) => {
    if (!confirm('Redeem this reward?')) return

    try {
      const result = await loyaltyService.redeemReward(joinedSalon._id, rewardId)
      toast.success('Reward redeemed successfully! 🎉')
      loadLoyaltyData() // Reload to show updated points
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to redeem reward')
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'Silver': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'Gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Platinum': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'Platinum': return <Crown className="text-purple-600" size={32} fill="currentColor" />
      case 'Gold': return <Award className="text-yellow-600" size={32} />
      case 'Silver': return <Star className="text-gray-600" size={32} />
      default: return <Award className="text-orange-600" size={32} />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!joinedSalon) {
    return (
      <div className="text-center py-12">
        <Gift className="mx-auto text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Salon Joined</h2>
        <p className="text-gray-600">Join a salon to start earning loyalty points!</p>
      </div>
    )
  }

  if (!loyaltyData || !loyaltyData.program) {
    return (
      <div className="text-center py-12">
        <Gift className="mx-auto text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Loyalty Program</h2>
        <p className="text-gray-600">This salon doesn't have a loyalty program yet</p>
      </div>
    )
  }

  const { points, tier, program, transactions } = loyaltyData
  const currentTierData = program.tiers[tier.toLowerCase()]
  
  // Find next tier
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tierOrder.indexOf(tier.toLowerCase())
  const nextTierKey = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null
  const nextTier = nextTierKey ? program.tiers[nextTierKey] : null
  const pointsToNext = nextTier ? nextTier.minPoints - points : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loyalty & Rewards</h1>
        <p className="text-gray-600 mt-1">Your points, tier, and rewards at {joinedSalon.name}</p>
      </div>

      {/* Points Card */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Your Points Balance</p>
              <p className="text-5xl font-bold text-primary-600">{points}</p>
              {nextTier && (
                <p className="text-sm text-gray-600 mt-2">
                  {pointsToNext} more points to reach {nextTier.name}
                </p>
              )}
            </div>
            <div className={`border-4 rounded-full p-4 ${getTierColor(tier)}`}>
              {getTierIcon(tier)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Tier Benefits */}
      <Card className={`border-2 ${getTierColor(tier)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTierIcon(tier)}
            {tier} Membership
            {currentTierData.discountPercentage > 0 && (
              <Badge variant="success">{currentTierData.discountPercentage}% OFF</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTierData.benefits && currentTierData.benefits.length > 0 ? (
            <ul className="space-y-2">
              {currentTierData.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={16} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No benefits configured for this tier</p>
          )}
        </CardContent>
      </Card>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="text-pink-600" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!program.rewards || program.rewards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No rewards available yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {program.rewards.filter(r => r.isActive).map((reward) => {
                const canAfford = points >= reward.pointsCost

                return (
                  <div key={reward._id} className={`border-2 rounded-lg p-4 ${canAfford ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <Gift className={canAfford ? 'text-green-600' : 'text-gray-400'} size={24} />
                      {canAfford && (
                        <Badge variant="success">Available!</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xl font-bold text-primary-600">
                        {reward.pointsCost} points
                      </span>
                      {reward.discountAmount > 0 && (
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(reward.discountAmount)} off
                        </span>
                      )}
                    </div>
                    <Button
                      fullWidth
                      className="mt-3"
                      disabled={!canAfford}
                      onClick={() => handleRedeem(reward._id)}
                    >
                      {canAfford ? 'Redeem Now' : `Need ${reward.pointsCost - points} more`}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No points history yet
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {transaction.type === 'earned' ? (
                      <Plus className="text-green-600" size={20} />
                    ) : (
                      <Minus className="text-red-600" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                    </p>
                    <p className="text-xs text-gray-500">Balance: {transaction.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientRewardsPage




