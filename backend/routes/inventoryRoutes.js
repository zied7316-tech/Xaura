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
  getProductHistory
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Low stock alerts
router.get('/alerts/low-stock', protect, authorize('Owner'), getLowStockProducts);

// CRUD operations
router.get('/', protect, authorize('Owner'), getProducts);
router.get('/:id', protect, authorize('Owner'), getProduct);
router.get('/:id/history', protect, authorize('Owner'), getProductHistory);
router.post('/', protect, authorize('Owner'), createProduct);
router.put('/:id', protect, authorize('Owner'), updateProduct);
router.delete('/:id', protect, authorize('Owner'), deleteProduct);

// Stock management
router.put('/:id/restock', protect, authorize('Owner'), restockProduct);
router.put('/:id/use', protect, authorize('Owner'), useProduct);

// Worker inventory endpoints
router.get('/worker/products', protect, authorize('Worker'), getWorkerProducts);
router.put('/worker/:id/use', protect, authorize('Worker'), workerUseProduct);
router.post('/worker/:id/sell', protect, authorize('Worker'), workerSellProduct);

module.exports = router;

