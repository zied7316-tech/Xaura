import { useState, useEffect } from 'react'
import { inventoryService } from '../../services/inventoryService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { 
  ShoppingCart, DollarSign, AlertTriangle, Search, RefreshCw, CreditCard
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

const WorkerProductsForSalePage = () => {
  const { t } = useLanguage()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [sellQuantity, setSellQuantity] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getWorkerProductsForSale()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error(t('worker.failedToLoadProducts', 'Failed to load products for sale'))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSellModal = (product) => {
    if (product.sellingPrice <= 0) {
      toast.error(t('worker.priceNotSet', 'Product selling price is not set'))
      return
    }
    setSelectedProduct(product)
    setSellQuantity('')
    setPaymentMethod('cash')
    setShowSellModal(true)
  }

  const handleSellProduct = async () => {
    if (!sellQuantity || parseFloat(sellQuantity) <= 0) {
      toast.error(t('worker.enterValidQuantity', 'Please enter a valid quantity'))
      return
    }

    if (parseFloat(sellQuantity) > selectedProduct.quantity) {
      toast.error(t('worker.insufficientStock', 'Insufficient stock'))
      return
    }

    try {
      const saleData = {
        quantity: parseFloat(sellQuantity),
        paymentMethod: paymentMethod
      }

      const result = await inventoryService.workerSellProduct(selectedProduct._id, saleData)
      toast.success(result.message || t('worker.productSold', 'Product sold successfully!'))
      setShowSellModal(false)
      loadProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || t('worker.failedToSell', 'Failed to sell product'))
    }
  }

  const calculateCommission = (product, quantity) => {
    if (!product.workerCommission) return 0
    
    const totalAmount = product.sellingPrice * quantity
    if (product.workerCommission.type === 'percentage') {
      return (totalAmount * (product.workerCommission.percentage || 0)) / 100
    } else if (product.workerCommission.type === 'fixed') {
      return (product.workerCommission.fixedAmount || 0) * quantity
    }
    return 0
  }

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('worker.productsForSale', 'Products for Sale')}</h1>
          <p className="text-gray-600 mt-1">{t('worker.sellProductsDescription', 'Sell products to customers with payment methods and commission tracking')}</p>
        </div>
        <Button onClick={loadProducts} variant="outline">
          <RefreshCw size={18} />
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('worker.searchProducts', 'Search products...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600">{t('worker.noProductsForSale', 'No products for sale available')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.sku && (
                      <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                    )}
                  </div>
                  <Badge variant="default">{t('worker.forSale', 'For Sale')}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('worker.stock', 'Stock')}:</span>
                    <span className={`font-semibold ${
                      product.quantity === 0 ? 'text-red-600' :
                      product.quantity <= product.lowStockThreshold ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {product.quantity} {product.unit}
                    </span>
                  </div>
                  {product.quantity <= product.lowStockThreshold && (
                    <div className="flex items-center gap-1 text-orange-600 text-sm">
                      <AlertTriangle size={14} />
                      <span>{t('worker.lowStock', 'Low stock')}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{t('worker.price', 'Price')}:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                  </div>
                  {product.workerCommission && (
                    <div className="text-xs text-gray-500">
                      {t('worker.commission', 'Commission')}: {
                        product.workerCommission.type === 'percentage'
                          ? `${product.workerCommission.percentage || 0}%`
                          : `${formatCurrency(product.workerCommission.fixedAmount || 0)} per unit`
                      }
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleOpenSellModal(product)}
                  disabled={product.quantity === 0 || product.sellingPrice <= 0}
                  fullWidth
                >
                  <ShoppingCart size={18} />
                  {t('worker.sellProduct', 'Sell Product')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sell Product Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title={t('worker.sellProduct', 'Sell Product')}
        size="sm"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {t('worker.available', 'Available')}: <span className="font-semibold">{selectedProduct.quantity} {selectedProduct.unit}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {t('worker.price', 'Price')}: <span className="font-semibold text-green-600">{formatCurrency(selectedProduct.sellingPrice)}</span>
              </p>
            </div>

            <Input
              label={`${t('worker.quantityToSell', 'Quantity to Sell')} (${selectedProduct.unit})`}
              type="number"
              min="1"
              max={selectedProduct.quantity}
              step="0.01"
              required
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              placeholder={t('worker.enterQuantity', 'Enter quantity')}
              autoFocus
            />

            {sellQuantity && parseFloat(sellQuantity) > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('worker.totalSale', 'Total Sale')}:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedProduct.sellingPrice * parseFloat(sellQuantity))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('worker.yourCommission', 'Your Commission')}:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(calculateCommission(selectedProduct, parseFloat(sellQuantity)))}
                  </span>
                </div>
              </div>
            )}

            <Select
              label={t('worker.paymentMethod', 'Payment Method')}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: t('worker.cash', 'Cash') },
                { value: 'card', label: t('worker.card', 'Card') },
                { value: 'bank_transfer', label: t('worker.bankTransfer', 'Bank Transfer') },
                { value: 'online', label: t('worker.online', 'Online') },
                { value: 'wallet', label: t('worker.wallet', 'Wallet') },
                { value: 'other', label: t('worker.other', 'Other') }
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSellProduct} fullWidth>
                <ShoppingCart size={18} />
                {t('worker.sellProduct', 'Sell Product')}
              </Button>
              <Button variant="outline" onClick={() => setShowSellModal(false)} fullWidth>
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerProductsForSalePage

