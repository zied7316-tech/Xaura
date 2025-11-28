const Product = require('../models/Product');
const ProductSale = require('../models/ProductSale');
const ProductHistory = require('../models/ProductHistory');
const User = require('../models/User');
const WorkerWallet = require('../models/WorkerWallet');
const WorkerEarning = require('../models/WorkerEarning');
const Payment = require('../models/Payment');
const { getOwnerSalon } = require('../utils/getOwnerSalon');

/**
 * Helper function to log product history
 */
const logProductHistory = async (data) => {
  try {
    const mongoose = require('mongoose');
    
    // Ensure all ObjectIds are properly converted
    const historyData = {
      ...data,
      productId: data.productId && mongoose.Types.ObjectId.isValid(data.productId)
        ? new mongoose.Types.ObjectId(data.productId)
        : data.productId,
      salonId: data.salonId && mongoose.Types.ObjectId.isValid(data.salonId)
        ? new mongoose.Types.ObjectId(data.salonId)
        : data.salonId,
      userId: data.userId && mongoose.Types.ObjectId.isValid(data.userId)
        ? new mongoose.Types.ObjectId(data.userId)
        : data.userId,
      // Handle optional ObjectId fields
      appointmentId: data.appointmentId && mongoose.Types.ObjectId.isValid(data.appointmentId)
        ? new mongoose.Types.ObjectId(data.appointmentId)
        : (data.appointmentId || null),
      productSaleId: data.productSaleId && mongoose.Types.ObjectId.isValid(data.productSaleId)
        ? new mongoose.Types.ObjectId(data.productSaleId)
        : (data.productSaleId || null)
    };
    
    const result = await ProductHistory.create(historyData);
    console.log(`✅ History created: ${result.actionType} for product ${result.productId} by ${result.userRole} (${result.userId})`);
    return result;
  } catch (error) {
    console.error('❌ Error logging product history:', error);
    console.error('History data that failed:', JSON.stringify(data, null, 2));
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    // Don't throw - history logging should not break the main operation
    return null;
  }
};

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

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: salonId,
      userId: ownerId,
      userRole: 'Owner',
      actionType: 'created',
      quantityBefore: 0,
      quantityAfter: product.quantity || 0,
      quantityChange: product.quantity || 0,
      description: `Product "${product.name}" created`,
      changes: req.body
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

    const quantityBefore = product.quantity;
    const changes = {};

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && product[key] !== req.body[key]) {
        changes[key] = { from: product[key], to: req.body[key] };
        product[key] = req.body[key];
      }
    });

    await product.save();

    // Log history if there were changes
    if (Object.keys(changes).length > 0) {
      await logProductHistory({
        productId: product._id,
        salonId: product.salonId,
        userId: req.user.id,
        userRole: 'Owner',
        actionType: 'updated',
        quantityBefore: quantityBefore,
        quantityAfter: product.quantity,
        quantityChange: product.quantity - quantityBefore,
        description: `Product "${product.name}" updated`,
        changes: changes
      });
    }

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
    const quantityBefore = product.quantity;
    product.isActive = false;
    await product.save();

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: product.salonId,
      userId: req.user.id,
      userRole: 'Owner',
      actionType: 'deleted',
      quantityBefore: quantityBefore,
      quantityAfter: product.quantity,
      quantityChange: 0,
      description: `Product "${product.name}" deleted (soft delete)`
    });

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
    const quantityBefore = product.quantity;
    product.quantity += quantity;
    product.lastRestockDate = new Date();
    product.lastRestockQuantity = quantity;

    await product.save();

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: product.salonId,
      userId: req.user.id,
      userRole: 'Owner',
      actionType: 'restock',
      quantityBefore: quantityBefore,
      quantityAfter: product.quantity,
      quantityChange: quantity,
      description: `Restocked ${quantity} ${product.unit} of "${product.name}"`
    });

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
    const quantityBefore = product.quantity;
    product.quantity -= quantity;
    await product.save();

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: product.salonId,
      userId: req.user.id,
      userRole: 'Owner',
      actionType: 'use',
      quantityBefore: quantityBefore,
      quantityAfter: product.quantity,
      quantityChange: -quantity,
      description: `Used ${quantity} ${product.unit} of "${product.name}"`
    });

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
    const quantityBefore = product.quantity;
    product.quantity -= quantity;
    await product.save();

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: worker.salonId, // Use worker.salonId for consistency with sell action
      userId: worker._id,
      userRole: 'Worker',
      actionType: 'use',
      quantityBefore: quantityBefore,
      quantityAfter: product.quantity,
      quantityChange: -quantity,
      description: `Worker used ${quantity} ${product.unit} of "${product.name}"`
    });

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
    const quantityBefore = product.quantity;
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

    // Log history
    await logProductHistory({
      productId: product._id,
      salonId: worker.salonId,
      userId: worker._id,
      userRole: 'Worker',
      actionType: 'sell',
      quantityBefore: quantityBefore,
      quantityAfter: product.quantity,
      quantityChange: -quantity,
      unitPrice: unitPrice,
      totalAmount: totalAmount,
      commissionAmount: workerCommissionAmount,
      paymentMethod: paymentMethod || 'cash',
      productSaleId: productSale._id,
      appointmentId: appointmentId || null,
      description: `Worker sold ${quantity} ${product.unit} of "${product.name}" for ${totalAmount.toFixed(2)} (Commission: ${workerCommissionAmount.toFixed(2)})`,
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

    // Create WorkerEarning record (only if there's an appointment, or create with null appointmentId for standalone sales)
    // For product sales without appointments, we still track earnings but appointmentId is optional
    const workerEarningData = {
      workerId: worker._id,
      salonId: worker.salonId,
      serviceId: null, // Product sale, not service
      servicePrice: totalAmount,
      originalPrice: null,
      finalPrice: null,
      commissionPercentage: commissionType === 'percentage' ? commissionValue : 0,
      workerEarning: workerCommissionAmount,
      paymentModelType: 'percentage_commission', // Product sales use commission model
      isPaid: true, // Product sales are paid immediately
      serviceDate: new Date()
    };
    
    // Only add appointmentId if provided (product sales can be standalone)
    if (appointmentId) {
      workerEarningData.appointmentId = appointmentId;
    }
    
    await WorkerEarning.create(workerEarningData);

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

/**
 * @desc    Get product history
 * @route   GET /api/inventory/:id/history
 * @access  Private (Owner)
 */
const getProductHistory = async (req, res, next) => {
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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Verify product belongs to owner's salon
    if (product.salonId.toString() !== salonData.salonId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Product does not belong to your salon'
      });
    }

    // Get history with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Convert productId to ObjectId if it's a string
    const mongoose = require('mongoose');
    const productObjectId = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? new mongoose.Types.ObjectId(req.params.id)
      : req.params.id;

    // Query history - ensure we use proper ObjectId format
    const historyQuery = { 
      productId: productObjectId
    };
    
    const history = await ProductHistory.find(historyQuery)
      .populate({
        path: 'userId',
        select: 'name email',
        model: 'User'
      })
      .populate({
        path: 'appointmentId',
        select: 'clientName dateTime',
        model: 'Appointment',
        options: { strictPopulate: false } // Allow null appointments
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ProductHistory.countDocuments(historyQuery);
    
    // Debug logging - show detailed info about what was found
    console.log(`📊 Product history query for productId: ${req.params.id}`);
    console.log(`   Found ${history.length} records (showing), total: ${total}`);
    console.log(`   Action types found:`, history.map(h => `${h.actionType}(${h._id})`).join(', ') || 'none');
    if (history.length > 0) {
      console.log(`   Sample record:`, {
        actionType: history[0].actionType,
        userId: history[0].userId?._id || history[0].userId,
        salonId: history[0].salonId,
        createdAt: history[0].createdAt
      });
    }

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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
  workerSellProduct,
  getProductHistory
};
