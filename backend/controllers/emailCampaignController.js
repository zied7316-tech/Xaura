const EmailCampaign = require('../models/EmailCampaign');
const EmailTemplate = require('../models/EmailTemplate');
const emailCampaignService = require('../services/emailCampaignService');
const { createActivityLog } = require('../middleware/activityLogger');

/**
 * @desc    Get all campaigns
 * @route   GET /api/super-admin/campaigns
 * @access  Private/SuperAdmin
 */
exports.getAllCampaigns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [campaigns, total] = await Promise.all([
      EmailCampaign.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      EmailCampaign.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single campaign
 * @route   GET /api/super-admin/campaigns/:id
 * @access  Private/SuperAdmin
 */
exports.getCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Create new campaign
 * @route   POST /api/super-admin/campaigns
 * @access  Private/SuperAdmin
 */
exports.createCampaign = async (req, res) => {
  try {
    const campaign = await emailCampaignService.createCampaign(
      req.body,
      req.user._id
    );

    // Log activity
    await createActivityLog(
      req,
      'campaign_created',
      'Campaign',
      campaign._id,
      campaign.name,
      { recipients: campaign.totalRecipients }
    );

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Update campaign
 * @route   PUT /api/super-admin/campaigns/:id
 * @access  Private/SuperAdmin
 */
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Only allow updating draft campaigns
    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update campaigns that are sent or scheduled',
      });
    }

    const { name, subject, content, segmentation } = req.body;

    if (name) campaign.name = name;
    if (subject) campaign.subject = subject;
    if (content) campaign.content = content;
    if (segmentation) {
      campaign.segmentation = segmentation;
      
      // Recalculate recipients
      const recipients = await emailCampaignService.segmentRecipients(segmentation);
      campaign.totalRecipients = recipients.length;
      campaign.recipientList = recipients.map((r) => ({
        salon: r.salon,
        email: r.email,
      }));
    }

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Send campaign
 * @route   POST /api/super-admin/campaigns/:id/send
 * @access  Private/SuperAdmin
 */
exports.sendCampaign = async (req, res) => {
  try {
    const result = await emailCampaignService.sendCampaign(req.params.id);

    const campaign = await EmailCampaign.findById(req.params.id);

    // Log activity
    await createActivityLog(
      req,
      'campaign_sent',
      'Campaign',
      campaign._id,
      campaign.name,
      { sent: result.sent, failed: result.failed }
    );

    res.json({
      success: true,
      message: 'Campaign sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Schedule campaign
 * @route   POST /api/super-admin/campaigns/:id/schedule
 * @access  Private/SuperAdmin
 */
exports.scheduleCampaign = async (req, res) => {
  try {
    const { scheduledFor } = req.body;

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        message: 'scheduledFor date is required',
      });
    }

    const campaign = await emailCampaignService.scheduleCampaign(
      req.params.id,
      scheduledFor
    );

    // Log activity
    await createActivityLog(
      req,
      'campaign_scheduled',
      'Campaign',
      campaign._id,
      campaign.name,
      { scheduledFor }
    );

    res.json({
      success: true,
      message: 'Campaign scheduled successfully',
      data: campaign,
    });
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Get campaign statistics
 * @route   GET /api/super-admin/campaigns/:id/stats
 * @access  Private/SuperAdmin
 */
exports.getCampaignStats = async (req, res) => {
  try {
    const stats = await emailCampaignService.getCampaignStats(req.params.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign statistics',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete campaign
 * @route   DELETE /api/super-admin/campaigns/:id
 * @access  Private/SuperAdmin
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Only allow deleting draft campaigns
    if (campaign.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete campaigns that are sent or scheduled',
      });
    }

    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message,
    });
  }
};

/**
 * @desc    Track email open (tracking pixel)
 * @route   GET /api/super-admin/campaigns/:id/track/open/:salonId
 * @access  Public
 */
exports.trackOpen = async (req, res) => {
  try {
    await emailCampaignService.trackOpen(req.params.id, req.params.salonId);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking open:', error);
    res.status(200).send();
  }
};

/**
 * @desc    Send test email
 * @route   POST /api/super-admin/campaigns/:id/test
 * @access  Private/SuperAdmin
 */
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const campaign = await EmailCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Send test email
    const emailServiceModule = require('../services/emailService');
    await emailServiceModule.sendEmail(
      email,
      `[TEST] ${campaign.subject}`,
      campaign.content
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
};

/**
 * @desc    Preview recipients
 * @route   POST /api/super-admin/campaigns/preview-recipients
 * @access  Private/SuperAdmin
 */
exports.previewRecipients = async (req, res) => {
  try {
    const { segmentation } = req.body;

    const recipients = await emailCampaignService.segmentRecipients(
      segmentation || {}
    );

    res.json({
      success: true,
      count: recipients.length,
      data: recipients.slice(0, 100), // Return first 100 for preview
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview recipients',
      error: error.message,
    });
  }
};

// ============ EMAIL TEMPLATES ============

/**
 * @desc    Get all email templates
 * @route   GET /api/super-admin/email-templates
 * @access  Private/SuperAdmin
 */
exports.getAllTemplates = async (req, res) => {
  try {
    const { category } = req.query;

    const query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const templates = await EmailTemplate.find(query)
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message,
    });
  }
};

/**
 * @desc    Create email template
 * @route   POST /api/super-admin/email-templates
 * @access  Private/SuperAdmin
 */
exports.createTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single template
 * @route   GET /api/super-admin/email-templates/:id
 * @access  Private/SuperAdmin
 */
exports.getTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message,
    });
  }
};


