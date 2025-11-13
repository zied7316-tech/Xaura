const express = require('express');
const router = express.Router();
const {
  getAllCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  sendCampaign,
  scheduleCampaign,
  getCampaignStats,
  deleteCampaign,
  trackOpen,
  sendTestEmail,
  previewRecipients,
  getAllTemplates,
  createTemplate,
  getTemplate,
} = require('../controllers/emailCampaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (for tracking)
router.get('/:id/track/open/:salonId', trackOpen);

// Protected routes (SuperAdmin only)
router.use(protect);
router.use(authorize('SuperAdmin'));

// Campaign routes
router.get('/', getAllCampaigns);
router.post('/', createCampaign);
router.post('/preview-recipients', previewRecipients);
router.get('/:id', getCampaign);
router.put('/:id', updateCampaign);
router.delete('/:id', deleteCampaign);
router.post('/:id/send', sendCampaign);
router.post('/:id/schedule', scheduleCampaign);
router.post('/:id/test', sendTestEmail);
router.get('/:id/stats', getCampaignStats);

// Template routes
router.get('/templates/all', getAllTemplates);
router.post('/templates', createTemplate);
router.get('/templates/:id', getTemplate);

module.exports = router;

