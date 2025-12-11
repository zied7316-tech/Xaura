const DailyOpeningCash = require('../models/DailyOpeningCash');
const Salon = require('../models/Salon');

/**
 * @desc    Get opening cash for a specific date
 * @route   GET /api/opening-cash
 * @access  Private (Owner)
 */
const getOpeningCash = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const { date } = req.query;
    let targetDate;
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const dateParts = date.split('-').map(Number);
      targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
    } else {
      targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    const openingCash = await DailyOpeningCash.findOne({
      salonId: salon._id,
      date: targetDate
    }).populate('updatedBy', 'name');

    if (!openingCash) {
      // Return default if not set
      return res.json({
        success: true,
        data: { amount: 0, date: targetDate }
      });
    }

    res.json({
      success: true,
      data: openingCash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create or update opening cash for a date
 * @route   POST /api/opening-cash
 * @access  Private (Owner)
 */
const setOpeningCash = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const { date, amount, notes } = req.body;
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    let targetDate;
    if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const dateParts = date.split('-').map(Number);
      targetDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0);
    } else {
      targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    const openingCash = await DailyOpeningCash.findOneAndUpdate(
      { salonId: salon._id, date: targetDate },
      {
        salonId: salon._id,
        date: targetDate,
        amount: amountValue,
        notes: notes || '',
        updatedBy: req.user.id
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('updatedBy', 'name');

    res.json({
      success: true,
      message: 'Opening cash updated successfully',
      data: openingCash
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get opening cash history
 * @route   GET /api/opening-cash/history
 * @access  Private (Owner)
 */
const getOpeningCashHistory = async (req, res, next) => {
  try {
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    const { startDate, endDate, limit = 30 } = req.query;
    const query = { salonId: salon._id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const startParts = startDate.split('-').map(Number);
        query.date.$gte = new Date(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0);
      }
      if (endDate) {
        const endParts = endDate.split('-').map(Number);
        query.date.$lte = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999);
      }
    }

    const history = await DailyOpeningCash.find(query)
      .populate('updatedBy', 'name')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: history.length,
      data: { history }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOpeningCash,
  setOpeningCash,
  getOpeningCashHistory
};

