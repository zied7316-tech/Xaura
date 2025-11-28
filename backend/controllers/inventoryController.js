const Product = require('../models/Product');
const ProductSale = require('../models/ProductSale');
const User = require('../models/User');
const WorkerWallet = require('../models/WorkerWallet');
const WorkerEarning = require('../models/WorkerEarning');
const Payment = require('../models/Payment');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * @desc    Get all products for salon
 * @route   GET /api/inventory
 * @access  Private (Owner)
 */
const getProducts = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = salonData.salonId;

    // Get all products
    const products = await Product.find({ salonId, isActive: true })
      .populate('usedInServices', 'name')
      .sort({ name: 1 });

    // Calculate statistics
    const totalProducts = products.length;
    const lowStockCount = products.filter(p => p.quantity <= p.lowStockThreshold).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);

    res.json({
      success: true,
      data: products,
      stats: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        totalValue
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/inventory/:id
 * @access  Private (Owner)
 */
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('usedInServices', 'name price');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new product
 * @route   POST /api/inventory
 * @access  Private (Owner)
 */
const createProduct = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = salonData.salonId;

    // Create product
    const product = await Product.create({
      ...req.body,
      salonId
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/inventory/:id
 * @access  Private (Owner)
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/inventory/:id
 * @access  Private (Owner)
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restock product
 * @route   PUT /api/inventory/:id/restock
 * @access  Private (Owner)
 */
const restockProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add to existing quantity
    product.quantity += quantity;
    product.lastRestockDate = new Date();
    product.lastRestockQuantity = quantity;

    await product.save();

    res.json({
      success: true,
      message: `Added ${quantity} ${product.unit} to stock`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Use/consume product (reduce quantity)
 * @route   PUT /api/inventory/:id/use
 * @access  Private (Owner)
 */
const useProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Reduce quantity
    product.quantity -= quantity;
    await product.save();

    res.json({
      success: true,
      message: `Used ${quantity} ${product.unit}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/inventory/alerts/low-stock
 * @access  Private (Owner)
 */
const getLowStockProducts = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon (supports multi-salon system)
    const salonData = await getOwnerSalon(ownerId);
    if (!salonData) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = salonData.salonId;

    // Find products where quantity <= lowStockThreshold
    const products = await Product.find({ 
      salonId,
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get products available to worker
 * @route   GET /api/inventory/worker/products
 * @access  Private (Worker)
 */
const getWorkerProducts = async (req, res, next) => {
  try {
    const worker = await User.findById(req.user.id);
    
    if (!worker || worker.role !== 'Worker') {
      return res.status(403).json({
        success: false,
        message: 'Only workers can access this endpoint'
      });
    }

    if (!worker.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Worker is not assigned to a salon'
      });
    }

    // Get all active products for worker's salon
    const products = await Product.find({ 
      salonId: worker.salonId, 
      isActive: true,
      quantity: { $gt: 0 } // Only show products in stock
    })
      .sort({ name: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker uses/consumes product (for_use products)
 * @route   PUT /api/inventory/worker/:id/use
 * @access  Private (Worker)
 */
const workerUseProduct = async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const worker = await User.findById(req.user.id);
    
    if (!worker || worker.role !== 'Worker' || !worker.salonId) {
      return res.status(403).json({
        success: false,
        message: 'Worker not authorized'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.salonId.toString() !== worker.salonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Product does not belong to your salon'
      });
    }

    if (product.productType !== 'for_use') {
      return res.status(400).json({
        success: false,
        message: 'This product is for sale, not for use'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    // Reduce quantity
    product.quantity -= quantity;
    await product.save();

    res.json({
      success: true,
      message: `Used ${quantity} ${product.unit} of ${product.name}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Worker sells product (for_sale products) - with commission
 * @route   POST /api/inventory/worker/:id/sell
 * @access  Private (Worker)
 */
const workerSellProduct = async (req, res, next) => {
  try {
    const { quantity, paymentMethod, appointmentId, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    const worker = await User.findById(req.user.id);
    
    if (!worker || worker.role !== 'Worker' || !worker.salonId) {
      return res.status(403).json({
        success: false,
        message: 'Worker not authorized'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.salonId.toString() !== worker.salonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Product does not belong to your salon'
      });
    }

    if (product.productType !== 'for_sale') {
      return res.status(400).json({
        success: false,
        message: 'This product is for use, not for sale'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    if (product.sellingPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Product selling price is not set'
      });
    }

    // Calculate sale amounts
    const unitPrice = product.sellingPrice;
    const totalAmount = unitPrice * quantity;

    // Calculate worker commission
    let workerCommissionAmount = 0;
    let commissionType = 'percentage';
    let commissionValue = 0;

    if (product.workerCommission && product.workerCommission.type) {
      commissionType = product.workerCommission.type;
      
      if (commissionType === 'percentage') {
        commissionValue = product.workerCommission.percentage || 0;
        workerCommissionAmount = (totalAmount * commissionValue) / 100;
      } else if (commissionType === 'fixed') {
        commissionValue = product.workerCommission.fixedAmount || 0;
        workerCommissionAmount = commissionValue * quantity;
      }
    }

    const salonRevenue = totalAmount - workerCommissionAmount;

    // Reduce product quantity
    product.quantity -= quantity;
    await product.save();

    // Create ProductSale record
    const productSale = await ProductSale.create({
      productId: product._id,
      workerId: worker._id,
      salonId: worker.salonId,
      quantity,
      unitPrice,
      totalAmount,
      commissionType,
      commissionValue,
      workerCommissionAmount,
      salonRevenue,
      paymentMethod: paymentMethod || 'cash',
      saleDate: new Date(),
      appointmentId: appointmentId || null,
      notes: notes || ''
    });

    // Update worker wallet
    let wallet = await WorkerWallet.findOne({ workerId: worker._id });
    if (!wallet) {
      wallet = await WorkerWallet.create({
        workerId: worker._id,
        salonId: worker.salonId,
        balance: workerCommissionAmount,
        totalEarned: workerCommissionAmount,
        totalPaid: 0
      });
    } else {
      wallet.balance += workerCommissionAmount;
      wallet.totalEarned += workerCommissionAmount;
      await wallet.save();
    }

    // Create WorkerEarning record
    await WorkerEarning.create({
      workerId: worker._id,
      salonId: worker.salonId,
      appointmentId: appointmentId || null,
      serviceId: null, // Product sale, not service
      servicePrice: totalAmount,
      originalPrice: null,
      finalPrice: null,
      commissionPercentage: commissionType === 'percentage' ? commissionValue : 0,
      workerEarning: workerCommissionAmount,
      paymentModelType: 'percentage_commission', // Product sales use commission model
      isPaid: true, // Product sales are paid immediately
      serviceDate: new Date()
    });

    // Create Payment record
    await Payment.create({
      salonId: worker.salonId,
      appointmentId: appointmentId || null,
      clientId: null, // Product sale may not have a client
      workerId: worker._id,
      amount: totalAmount,
      paymentMethod: paymentMethod || 'cash',
      status: 'completed',
      paidAt: new Date(),
      workerCommission: {
        percentage: commissionType === 'percentage' ? commissionValue : 0,
        amount: workerCommissionAmount
      },
      salonRevenue: salonRevenue,
      notes: `Product sale: ${product.name} (${quantity} ${product.unit})`
    });

    res.status(201).json({
      success: true,
      message: `Product sold successfully. You earned ${workerCommissionAmount.toFixed(2)} commission.`,
      data: {
        sale: productSale,
        product: product,
        commission: {
          type: commissionType,
          value: commissionValue,
          amount: workerCommissionAmount
        },
        walletBalance: wallet.balance
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  workerSellProduct
};
