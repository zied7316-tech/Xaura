import { useState, useEffect } from 'react'
import { inventoryService } from '../../services/inventoryService'
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { 
  Package, Plus, Edit, Trash2, AlertTriangle, TrendingUp,
  Search, Filter, RefreshCw, ShoppingCart, DollarSign, Box, History, Clock, User
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '../../utils/helpers'
import toast from 'react-hot-toast'

const InventoryPage = () => {
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [restockProduct, setRestockProduct] = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [restockQuantity, setRestockQuantity] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    sku: '',
    quantity: 0,
    unit: 'pieces',
    lowStockThreshold: 10,
    productType: 'for_use',
    costPrice: 0,
    sellingPrice: 0,
    workerCommission: {
      type: 'percentage',
      percentage: 0,
      fixedAmount: 0
    },
    supplier: {
      name: '',
      contact: '',
      email: ''
    },
    notes: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await inventoryService.getProducts()
      setProducts(data.data || [])
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        sku: product.sku || '',
        quantity: product.quantity,
        unit: product.unit,
        lowStockThreshold: product.lowStockThreshold,
        productType: product.productType || 'for_use',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        workerCommission: product.workerCommission || {
          type: 'percentage',
          percentage: 0,
          fixedAmount: 0
        },
        supplier: product.supplier || { name: '', contact: '', email: '' },
        notes: product.notes || ''
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        category: 'Other',
        sku: '',
        quantity: 0,
        unit: 'pieces',
        lowStockThreshold: 10,
        productType: 'for_use',
        costPrice: 0,
        sellingPrice: 0,
        workerCommission: {
          type: 'percentage',
          percentage: 0,
          fixedAmount: 0
        },
        supplier: { name: '', contact: '', email: '' },
        notes: ''
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct._id, formData)
        toast.success('Product updated successfully!')
      } else {
        await inventoryService.createProduct(formData)
        toast.success('Product added successfully!')
      }
      setShowModal(false)
      setEditingProduct(null)
      // Reset form data
      setFormData({
        name: '',
        description: '',
        category: 'Other',
        sku: '',
        quantity: 0,
        unit: 'pieces',
        lowStockThreshold: 10,
        productType: 'for_use',
        costPrice: 0,
        sellingPrice: 0,
        workerCommission: {
          type: 'percentage',
          percentage: 0,
          fixedAmount: 0
        },
        supplier: { name: '', contact: '', email: '' },
        notes: ''
      })
      // Reload products
      await loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to save product')
    }
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await inventoryService.deleteProduct(productId)
      toast.success('Product deleted successfully!')
      loadProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleOpenRestock = (product) => {
    setRestockProduct(product)
    setRestockQuantity('')
    setShowRestockModal(true)
  }

  const handleOpenHistory = async (product) => {
    setHistoryProduct(product)
    setShowHistoryModal(true)
    await loadProductHistory(product._id)
  }

  const loadProductHistory = async (productId) => {
    try {
      setHistoryLoading(true)
      const response = await inventoryService.getProductHistory(productId)
      // API interceptor already unwraps response.data, so response is { success, data, pagination }
      console.log('Product history response:', response)
      if (response && response.data) {
        setHistory(Array.isArray(response.data) ? response.data : [])
      } else {
        console.warn('Unexpected response structure:', response)
        setHistory([])
      }
    } catch (error) {
      console.error('Error loading product history:', error)
      console.error('Error details:', error.response || error.message)
      toast.error(error.response?.data?.message || 'Failed to load product history')
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleRestock = async () => {
    if (!restockQuantity || parseFloat(restockQuantity) <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    try {
      await inventoryService.restockProduct(restockProduct._id, parseFloat(restockQuantity))
      toast.success(`Added ${restockQuantity} ${restockProduct.unit} to stock!`)
      setShowRestockModal(false)
      loadProducts()
    } catch (error) {
      toast.error('Failed to restock product')
    }
  }

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'Hair Care', 'Styling Products', 'Tools', 'Supplies', 'Cleaning', 'Other']
  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'liters', label: 'Liters' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'grams', label: 'Grams' },
    { value: 'other', label: 'Other' }
  ]

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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Track products, supplies, and stock levels</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add Product
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="text-indigo-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Box className="text-red-600" size={24} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600">No products found</p>
              <Button onClick={() => handleOpenModal()} className="mt-4">
                <Plus size={18} />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <Badge variant="outline">{product.category}</Badge>
                          <div className="mt-1">
                            <Badge variant={product.productType === 'for_sale' ? 'default' : 'secondary'} className="text-xs">
                              {product.productType === 'for_sale' ? 'For Sale' : 'For Use'}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            product.quantity === 0 ? 'text-red-600' :
                            product.quantity <= product.lowStockThreshold ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {product.quantity} {product.unit}
                          </span>
                          {product.quantity <= product.lowStockThreshold && (
                            <AlertTriangle className="text-orange-500" size={16} />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Alert at: {product.lowStockThreshold}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{formatCurrency(product.costPrice)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-green-600 font-semibold">{formatCurrency(product.sellingPrice)}</span>
                          {product.productType === 'for_sale' && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.workerCommission?.type === 'percentage' 
                                ? `${product.workerCommission.percentage || 0}% commission`
                                : product.workerCommission?.type === 'fixed'
                                ? `${formatCurrency(product.workerCommission.fixedAmount || 0)} per unit`
                                : 'No commission set'
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {product.supplier?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenHistory(product)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="View History"
                          >
                            <History size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenRestock(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Restock"
                          >
                            <ShoppingCart size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Hair Gel"
            />
            <Input
              label="SKU (Optional)"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., HG-001"
            />
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            placeholder="Product description..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Hair Care', label: 'Hair Care' },
                { value: 'Styling Products', label: 'Styling Products' },
                { value: 'Tools', label: 'Tools' },
                { value: 'Supplies', label: 'Supplies' },
                { value: 'Cleaning', label: 'Cleaning' },
                { value: 'Other', label: 'Other' }
              ]}
            />
            <Select
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={units}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Product Type"
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              options={[
                { value: 'for_use', label: 'For Use (Internal)' },
                { value: 'for_sale', label: 'For Sale' }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Current Quantity"
              type="number"
              min="0"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Low Stock Alert Threshold"
              type="number"
              min="0"
              required
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              min="0"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Selling Price"
              type="number"
              step="0.01"
              min="0"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {formData.productType === 'for_sale' && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Worker Commission Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select
                  label="Commission Type"
                  value={formData.workerCommission.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    workerCommission: {
                      ...formData.workerCommission,
                      type: e.target.value
                    }
                  })}
                  options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'fixed', label: 'Fixed Price' }
                  ]}
                />
              </div>
              {formData.workerCommission.type === 'percentage' ? (
                <Input
                  label="Commission Percentage (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.workerCommission.percentage}
                  onChange={(e) => setFormData({
                    ...formData,
                    workerCommission: {
                      ...formData.workerCommission,
                      percentage: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="e.g., 20 for 20%"
                />
              ) : (
                <Input
                  label="Fixed Commission per Unit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.workerCommission.fixedAmount}
                  onChange={(e) => setFormData({
                    ...formData,
                    workerCommission: {
                      ...formData.workerCommission,
                      fixedAmount: parseFloat(e.target.value) || 0
                    }
                  })}
                  placeholder="e.g., 2.00"
                />
              )}
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Supplier Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Supplier Name"
                value={formData.supplier.name}
                onChange={(e) => setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, name: e.target.value }
                })}
              />
              <Input
                label="Contact"
                value={formData.supplier.contact}
                onChange={(e) => setFormData({
                  ...formData,
                  supplier: { ...formData.supplier, contact: e.target.value }
                })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.supplier.email}
              onChange={(e) => setFormData({
                ...formData,
                supplier: { ...formData.supplier, email: e.target.value }
              })}
              className="mt-4"
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Additional notes..."
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" fullWidth>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal
        isOpen={showRestockModal}
        onClose={() => setShowRestockModal(false)}
        title="Restock Product"
        size="sm"
      >
        {restockProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{restockProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Current Stock: <span className="font-semibold">{restockProduct.quantity} {restockProduct.unit}</span>
              </p>
            </div>

            <Input
              label={`Quantity to Add (${restockProduct.unit})`}
              type="number"
              min="1"
              step="1"
              required
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              placeholder="Enter quantity"
              autoFocus
            />

            <div className="flex gap-3 pt-4">
              <Button onClick={handleRestock} fullWidth>
                <ShoppingCart size={18} />
                Add to Stock
              </Button>
              <Button variant="outline" onClick={() => setShowRestockModal(false)} fullWidth>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Product History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={`Product History${historyProduct ? ` - ${historyProduct.name}` : ''}`}
        size="lg"
      >
        {historyProduct && (
          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <History className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No history available for this product</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {history.map((item, index) => {
                  const actionColors = {
                    created: 'bg-green-100 text-green-800 border-green-200',
                    updated: 'bg-blue-100 text-blue-800 border-blue-200',
                    deleted: 'bg-red-100 text-red-800 border-red-200',
                    restock: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    use: 'bg-orange-100 text-orange-800 border-orange-200',
                    sell: 'bg-purple-100 text-purple-800 border-purple-200'
                  }

                  const actionIcons = {
                    created: '➕',
                    updated: '✏️',
                    deleted: '🗑️',
                    restock: '📦',
                    use: '🔧',
                    sell: '💰'
                  }

                  return (
                    <div
                      key={item._id || index}
                      className={`border rounded-lg p-4 ${actionColors[item.actionType] || 'bg-gray-100 border-gray-200'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{actionIcons[item.actionType] || '📝'}</span>
                          <span className="font-semibold capitalize">{item.actionType}</span>
                        </div>
                        <div className="text-sm flex items-center gap-1 text-gray-600">
                          <Clock size={14} />
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>

                      <div className="mt-2 space-y-1 text-sm">
                        {item.userId && (
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span className="font-medium">
                              {item.userId.name || item.userId.email || 'Unknown User'}
                            </span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.userRole}
                            </Badge>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-gray-700 mt-2">{item.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-300">
                          <div>
                            <span className="text-xs text-gray-600">Quantity Before:</span>
                            <span className="ml-2 font-semibold">{item.quantityBefore} {historyProduct.unit}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Quantity After:</span>
                            <span className="ml-2 font-semibold">{item.quantityAfter} {historyProduct.unit}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-600">Change:</span>
                            <span className={`ml-2 font-semibold ${item.quantityChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.quantityChange >= 0 ? '+' : ''}{item.quantityChange} {historyProduct.unit}
                            </span>
                          </div>
                        </div>

                        {item.actionType === 'sell' && (
                          <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Total Amount:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(item.totalAmount)}</span>
                            </div>
                            {item.commissionAmount > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Worker Commission:</span>
                                <span className="font-semibold text-purple-600">{formatCurrency(item.commissionAmount)}</span>
                              </div>
                            )}
                            {item.paymentMethod && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600">Payment Method:</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {item.paymentMethod}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}

                        {item.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="text-xs text-gray-600 italic">Notes: {item.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default InventoryPage
