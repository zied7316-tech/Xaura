import { useEffect, useState } from 'react'
import { financialService } from '../../services/financialService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'

const FinancesPage = () => {
  const [revenue, setRevenue] = useState(null)
  const [profitLoss, setProfitLoss] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const revenueData = await financialService.getRevenueSummary()
        const plData = await financialService.getProfitLoss()
        setRevenue(revenueData)
        setProfitLoss(plData)
      } catch (error) {
        console.error('Error fetching financial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
          <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-gray-600 mt-1">Track your salon's financial performance</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(revenue?.totalRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {revenue?.paymentCount || 0} payments
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {formatCurrency(revenue?.netRevenue || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">After commissions</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Activity className="text-primary-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(profitLoss?.profit || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Margin: {profitLoss?.profitMargin || 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(profitLoss?.expenses || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {profitLoss?.expenseCount || 0} items
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-orange-600" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Business Account Notice */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎉 Business Account Features Active!
              </h3>
              <p className="text-gray-700 mb-4">
                Your salon now has complete financial management, customer CRM, inventory tracking, and business analytics!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-sm">
                  <div className="font-semibold text-green-700">✓ Payments</div>
                  <div className="text-gray-600">Track revenue</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-blue-700">✓ Expenses</div>
                  <div className="text-gray-600">Manage costs</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-purple-700">✓ CRM</div>
                  <div className="text-gray-600">Customer data</div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-orange-700">✓ Inventory</div>
                  <div className="text-gray-600">Stock alerts</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-4">
              Payment history will appear here as you record transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-4">
              Expense categories and trends will be displayed here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FinancesPage

