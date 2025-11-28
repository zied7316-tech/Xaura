import { useState, useEffect } from 'react'
import { inventoryService } from '../../services/inventoryService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { 
  Package, ShoppingCart, DollarSign, AlertTriangle, Search, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkerInventoryPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUseModal, setShowUseModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [useQuantity, setUseQuantity] = useState('')
  const [sellQuantity, setSellQuantity] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getWorkerProducts()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenUseModal = (product) => {
    if (product.productType !== 'for_use') {
      toast.error('This product is for sale, not for use')
      return
    }
    setSelectedProduct(product)
    setUseQuantity('')
    setShowUseModal(true)
  }

  const handleOpenSellModal = (product) => {
    if (product.productType !== 'for_sale') {
      toast.error('This product is for use, not for sale')
      return
    }
    if (product.sellingPrice <= 0) {
      toast.error('Product selling price is not set')
      return
    }
    setSelectedProduct(product)
    setSellQuantity('')
    setPaymentMethod('cash')
    setShowSellModal(true)
  }

  const handleUseProduct = async () => {
    if (!useQuantity || parseFloat(useQuantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (parseFloat(useQuantity) > selectedProduct.quantity) {
      toast.error('Insufficient stock')
      return
    }

    try {
      await inventoryService.workerUseProduct(selectedProduct._id, parseFloat(useQuantity))
      toast.success(`Used ${useQuantity} ${selectedProduct.unit} of ${selectedProduct.name}`)
      setShowUseModal(false)
      loadProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to use product')
    }
  }

  const handleSellProduct = async () => {
    if (!sellQuantity || parseFloat(sellQuantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (parseFloat(sellQuantity) > selectedProduct.quantity) {
      toast.error('Insufficient stock')
      return
    }

    try {
      const saleData = {
        quantity: parseFloat(sellQuantity),
        paymentMethod: paymentMethod
      }

      const result = await inventoryService.workerSellProduct(selectedProduct._id, saleData)
      toast.success(result.message || 'Product sold successfully!')
      setShowSellModal(false)
      loadProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to sell product')
    }
  }

  const calculateCommission = (product, quantity) => {
    if (!product.workerCommission || product.productType !== 'for_sale') return 0
    
    const totalAmount = product.sellingPrice * quantity
    if (product.workerCommission.type === 'percentage') {
      return (totalAmount * (product.workerCommission.percentage || 0)) / 100
    } else if (product.workerCommission.type === 'fixed') {
      return (product.workerCommission.fixedAmount || 0) * quantity
    }
    return 0
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || product.productType === filterType
    return matchesSearch && matchesType
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
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Use or sell products from your salon</p>
        </div>
        <Button onClick={loadProducts} variant="outline">
          <RefreshCw size={18} />
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="for_use">For Use</option>
              <option value="for_sale">For Sale</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600">No products available</p>
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
                  <Badge variant={product.productType === 'for_sale' ? 'default' : 'secondary'}>
                    {product.productType === 'for_sale' ? 'For Sale' : 'For Use'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Stock:</span>
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
                      <span>Low stock</span>
                    </div>
                  )}
                </div>

                {product.productType === 'for_sale' && (
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                    </div>
                    {product.workerCommission && (
                      <div className="text-xs text-gray-500">
                        Commission: {
                          product.workerCommission.type === 'percentage'
                            ? `${product.workerCommission.percentage || 0}%`
                            : `${formatCurrency(product.workerCommission.fixedAmount || 0)} per unit`
                        }
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {product.productType === 'for_use' ? (
                    <Button
                      onClick={() => handleOpenUseModal(product)}
                      disabled={product.quantity === 0}
                      fullWidth
                      variant="outline"
                    >
                      <Package size={18} />
                      Use Product
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleOpenSellModal(product)}
                      disabled={product.quantity === 0 || product.sellingPrice <= 0}
                      fullWidth
                    >
                      <ShoppingCart size={18} />
                      Sell Product
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Use Product Modal */}
      <Modal
        isOpen={showUseModal}
        onClose={() => setShowUseModal(false)}
        title="Use Product"
        size="sm"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Available: <span className="font-semibold">{selectedProduct.quantity} {selectedProduct.unit}</span>
              </p>
            </div>

            <Input
              label={`Quantity to Use (${selectedProduct.unit})`}
              type="number"
              min="1"
              max={selectedProduct.quantity}
              step="0.01"
              required
              value={useQuantity}
              onChange={(e) => setUseQuantity(e.target.value)}
              placeholder="Enter quantity"
              autoFocus
            />

            <div className="flex gap-3 pt-4">
              <Button onClick={handleUseProduct} fullWidth>
                <Package size={18} />
                Use Product
              </Button>
              <Button variant="outline" onClick={() => setShowUseModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sell Product Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title="Sell Product"
        size="sm"
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Available: <span className="font-semibold">{selectedProduct.quantity} {selectedProduct.unit}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Price: <span className="font-semibold text-green-600">{formatCurrency(selectedProduct.sellingPrice)}</span>
              </p>
            </div>

            <Input
              label={`Quantity to Sell (${selectedProduct.unit})`}
              type="number"
              min="1"
              max={selectedProduct.quantity}
              step="0.01"
              required
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              placeholder="Enter quantity"
              autoFocus
            />

            {sellQuantity && parseFloat(sellQuantity) > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Sale:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(selectedProduct.sellingPrice * parseFloat(sellQuantity))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Commission:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(calculateCommission(selectedProduct, parseFloat(sellQuantity)))}
                  </span>
                </div>
              </div>
            )}

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'online', label: 'Online' },
                { value: 'other', label: 'Other' }
              ]}
            />

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSellProduct} fullWidth>
                <ShoppingCart size={18} />
                Sell Product
              </Button>
              <Button variant="outline" onClick={() => setShowSellModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default WorkerInventoryPage

