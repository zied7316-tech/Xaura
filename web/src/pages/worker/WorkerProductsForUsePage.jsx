import { useState, useEffect } from 'react'
import { inventoryService } from '../../services/inventoryService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { 
  Wrench, AlertTriangle, Search, RefreshCw, Package, DollarSign
} from 'lucide-react'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

const WorkerProductsForUsePage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUseModal, setShowUseModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [useQuantity, setUseQuantity] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await inventoryService.getWorkerProductsForUse()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products for use')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenUseModal = (product) => {
    setSelectedProduct(product)
    setUseQuantity('')
    setShowUseModal(true)
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
      const result = await inventoryService.workerUseProduct(selectedProduct._id, parseFloat(useQuantity))
      const usageCost = result?.usageCost || (parseFloat(useQuantity) * selectedProduct.costPrice)
      const costMessage = usageCost > 0 ? ` (Cost: ${formatCurrency(usageCost)})` : ''
      toast.success(`Used ${useQuantity} ${selectedProduct.unit} of ${selectedProduct.name}${costMessage}`)
      setShowUseModal(false)
      loadProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to use product')
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Products for Use</h1>
          <p className="text-gray-600 mt-1">Track internal product usage for stock management</p>
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
                placeholder="Search products..."
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
            <Wrench className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600">No products for use available</p>
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
                  <Badge variant="secondary">For Use</Badge>
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
                  {product.costPrice > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Cost: {formatCurrency(product.costPrice)} per {product.unit}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleOpenUseModal(product)}
                  disabled={product.quantity === 0}
                  fullWidth
                  variant="outline"
                >
                  <Package size={18} />
                  Use Product
                </Button>
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
            
            {useQuantity && parseFloat(useQuantity) > 0 && selectedProduct.costPrice > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Usage Cost:</span>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(parseFloat(useQuantity) * selectedProduct.costPrice)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {parseFloat(useQuantity)} {selectedProduct.unit} × {formatCurrency(selectedProduct.costPrice)} per {selectedProduct.unit}
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  This cost will be automatically recorded in finance as an expense.
                </p>
              </div>
            )}

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
    </div>
  )
}

export default WorkerProductsForUsePage

