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
  getLowStockProducts
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Low stock alerts
router.get('/alerts/low-stock', protect, authorize('Owner'), getLowStockProducts);

// CRUD operations
router.get('/', protect, authorize('Owner'), getProducts);
router.get('/:id', protect, authorize('Owner'), getProduct);
router.post('/', protect, authorize('Owner'), createProduct);
router.put('/:id', protect, authorize('Owner'), updateProduct);
router.delete('/:id', protect, authorize('Owner'), deleteProduct);

// Stock management
router.put('/:id/restock', protect, authorize('Owner'), restockProduct);
router.put('/:id/use', protect, authorize('Owner'), useProduct);

module.exports = router;

