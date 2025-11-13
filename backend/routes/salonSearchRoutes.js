const express = require('express');
const router = express.Router();
const {
  searchSalons,
  getSalonDetails,
  getSalonCities
} = require('../controllers/salonSearchController');

// Public routes - no authentication required
router.get('/cities', getSalonCities);
router.get('/:id', getSalonDetails);
router.get('/', searchSalons);

module.exports = router;

