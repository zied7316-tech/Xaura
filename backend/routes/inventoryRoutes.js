const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  useProduct,
  getLowStockProducts,
  getWorkerProducts,
  workerUseProduct,
  workerSellProduct,
  getProductHistory,
  getProductsForSale,
  getProductsForUse,
  getWorkerProductsForSale,
  getWorkerProductsForUse
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Low stock alerts
router.get('/alerts/low-stock', protect, authorize('Owner'), getLowStockProducts);

// Separated product type endpoints (must come before generic routes)
router.get('/for-sale', protect, authorize('Owner'), getProductsForSale);
router.get('/for-use', protect, authorize('Owner'), getProductsForUse);

// CRUD operations
router.get('/', protect, authorize('Owner'), getProducts);
router.get('/:id/history', protect, authorize('Owner'), getProductHistory); // Must come before /:id route
router.get('/:id', protect, authorize('Owner'), getProduct);
router.post('/', protect, authorize('Owner'), createProduct);
router.put('/:id', protect, authorize('Owner'), updateProduct);
router.delete('/:id', protect, authorize('Owner'), deleteProduct);

// Stock management
router.put('/:id/restock', protect, authorize('Owner'), restockProduct);
router.put('/:id/use', protect, authorize('Owner'), useProduct);

// Worker inventory endpoints - separated by type
router.get('/worker/products-for-sale', protect, authorize('Worker'), getWorkerProductsForSale);
router.get('/worker/products-for-use', protect, authorize('Worker'), getWorkerProductsForUse);
router.get('/worker/products', protect, authorize('Worker'), getWorkerProducts); // Keep for backward compatibility
router.put('/worker/:id/use', protect, authorize('Worker'), workerUseProduct);
router.post('/worker/:id/sell', protect, authorize('Worker'), workerSellProduct);

module.exports = router;

