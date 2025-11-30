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
const { checkSubscriptionFeature } = require('../middleware/subscriptionMiddleware');

// Low stock alerts - requires basicInventory
router.get('/alerts/low-stock', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getLowStockProducts);

// Separated product type endpoints (must come before generic routes) - requires basicInventory
router.get('/for-sale', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getProductsForSale);
router.get('/for-use', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getProductsForUse);

// CRUD operations - requires basicInventory
router.get('/', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getProducts);
router.get('/:id/history', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getProductHistory); // Must come before /:id route
router.get('/:id', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), getProduct);
router.post('/', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), createProduct);
router.put('/:id', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), updateProduct);
router.delete('/:id', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), deleteProduct);

// Stock management - requires basicInventory
router.put('/:id/restock', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), restockProduct);
router.put('/:id/use', protect, authorize('Owner'), checkSubscriptionFeature('basicInventory'), useProduct);

// Worker inventory endpoints - separated by type
router.get('/worker/products-for-sale', protect, authorize('Worker'), getWorkerProductsForSale);
router.get('/worker/products-for-use', protect, authorize('Worker'), getWorkerProductsForUse);
router.get('/worker/products', protect, authorize('Worker'), getWorkerProducts); // Keep for backward compatibility
router.put('/worker/:id/use', protect, authorize('Worker'), workerUseProduct);
router.post('/worker/:id/sell', protect, authorize('Worker'), workerSellProduct);

module.exports = router;

