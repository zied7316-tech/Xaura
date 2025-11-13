const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @desc    Get all products for salon
 * @route   GET /api/inventory
 * @access  Private (Owner)
 */
const getProducts = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

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

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

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

    // Get owner's salon
    const owner = await User.findById(ownerId).populate('salonId');
    if (!owner || !owner.salonId) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const salonId = owner.salonId._id;

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

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restockProduct,
  useProduct,
  getLowStockProducts
};
