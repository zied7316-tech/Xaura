const EmailCampaign = require('../models/EmailCampaign');
const Salon = require('../models/Salon');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const emailService = require('./emailService');

/**
 * Segment recipients based on criteria
 */
const segmentRecipients = async (segmentation) => {
  try {
    let query = { isActive: true };

    // Build subscription query
    let subscriptionQuery = {};
    
    if (segmentation.plan && segmentation.plan.length > 0) {
      subscriptionQuery.plan = { $in: segmentation.plan };
    }

    if (segmentation.status && segmentation.status.length > 0) {
      subscriptionQuery.status = { $in: segmentation.status };
    }

    // Get salon IDs from subscriptions if needed
    let salonIdsFromSubs = null;
    if (Object.keys(subscriptionQuery).length > 0) {
      const subscriptions = await Subscription.find(subscriptionQuery).select('salon');
      salonIdsFromSubs = subscriptions.map((s) => s.salon);
      query._id = { $in: salonIdsFromSubs };
    }

    // Date filters
    if (segmentation.joinedAfter) {
      query.createdAt = { ...query.createdAt, $gte: new Date(segmentation.joinedAfter) };
    }

    if (segmentation.joinedBefore) {
      query.createdAt = { ...query.createdAt, $lte: new Date(segmentation.joinedBefore) };
    }

    // Worker count filter
    if (segmentation.hasWorkers !== undefined) {
      const salonsWithWorkers = await User.aggregate([
        { $match: { role: 'Worker', isActive: true } },
        { $group: { _id: '$salonId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 0 } } },
      ]);

      const salonIds = salonsWithWorkers.map((s) => s._id);
      
      if (segmentation.hasWorkers) {
        query._id = query._id ? { $in: query._id.$in.filter(id => salonIds.includes(id)) } : { $in: salonIds };
      } else {
        query._id = query._id ? { $in: query._id.$in.filter(id => !salonIds.includes(id)) } : { $nin: salonIds };
      }
    }

    // Revenue filter
    if (segmentation.minRevenue || segmentation.maxRevenue) {
      const revenueMatch = {};
      if (segmentation.minRevenue) revenueMatch.$gte = segmentation.minRevenue;
      if (segmentation.maxRevenue) revenueMatch.$lte = segmentation.maxRevenue;

      const salonsWithRevenue = await Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$salonId', totalRevenue: { $sum: '$amount' } } },
        { $match: { totalRevenue: revenueMatch } },
      ]);

      const salonIds = salonsWithRevenue.map((s) => s._id);
      query._id = query._id ? { $in: query._id.$in.filter(id => salonIds.map(String).includes(id.toString())) } : { $in: salonIds };
    }

    // Get salons
    const salons = await Salon.find(query).select('_id name email').lean();

    // Get owner emails for each salon
    const recipients = await Promise.all(
      salons.map(async (salon) => {
        const owner = await User.findOne({
          salonId: salon._id,
          role: 'Owner',
          isActive: true,
        }).select('email name');

        return {
          salon: salon._id,
          email: owner?.email || salon.email,
          salonName: salon.name,
          ownerName: owner?.name || 'Owner',
        };
      })
    );

    return recipients.filter((r) => r.email);
  } catch (error) {
    console.error('Error segmenting recipients:', error);
    throw error;
  }
};

/**
 * Create campaign and calculate recipients
 */
const createCampaign = async (campaignData, createdBy) => {
  try {
    // Get recipients based on segmentation
    const recipients = await segmentRecipients(campaignData.segmentation || {});

    // Create campaign
    const campaign = await EmailCampaign.create({
      ...campaignData,
      createdBy,
      totalRecipients: recipients.length,
      recipientList: recipients.map((r) => ({
        salon: r.salon,
        email: r.email,
      })),
    });

    return campaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

/**
 * Send campaign to all recipients
 */
const sendCampaign = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId).populate('recipientList.salon');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign already sent or in progress');
    }

    // Update status
    campaign.status = 'sending';
    await campaign.save();

    let successCount = 0;
    let failureCount = 0;

    // Send emails
    for (const recipient of campaign.recipientList) {
      try {
        // Add tracking pixel and links
        const trackingPixel = `<img src="${process.env.BACKEND_URL || 'http://localhost:5000'}/api/super-admin/campaigns/${campaign._id}/track/open/${recipient.salon}" width="1" height="1" style="display:none" />`;
        
        const contentWithTracking = campaign.content + trackingPixel;

        // Replace variables
        const personalizedContent = contentWithTracking
          .replace(/{{salonName}}/g, recipient.salon?.name || 'Salon')
          .replace(/{{ownerName}}/g, 'Owner');

        await emailService.sendEmail(
          recipient.email,
          campaign.subject,
          personalizedContent
        );

        // Mark as sent
        recipient.sent = true;
        recipient.sentAt = new Date();
        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        recipient.failed = true;
        recipient.failureReason = error.message;
        failureCount++;
      }
    }

    // Update campaign stats
    campaign.status = failureCount === campaign.totalRecipients ? 'failed' : 'sent';
    campaign.sentAt = new Date();
    campaign.stats.sent = successCount;
    campaign.stats.delivered = successCount;
    campaign.stats.failed = failureCount;

    await campaign.save();

    return {
      success: true,
      sent: successCount,
      failed: failureCount,
    };
  } catch (error) {
    console.error('Error sending campaign:', error);
    
    // Update campaign status to failed
    await EmailCampaign.findByIdAndUpdate(campaignId, {
      status: 'failed',
    });

    throw error;
  }
};

/**
 * Schedule campaign for later
 */
const scheduleCampaign = async (campaignId, scheduledFor) => {
  try {
    const campaign = await EmailCampaign.findByIdAndUpdate(
      campaignId,
      {
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor),
      },
      { new: true }
    );

    return campaign;
  } catch (error) {
    console.error('Error scheduling campaign:', error);
    throw error;
  }
};

/**
 * Process scheduled campaigns (for cron job)
 */
const processScheduledCampaigns = async () => {
  try {
    const now = new Date();

    const scheduledCampaigns = await EmailCampaign.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    });

    console.log(`Found ${scheduledCampaigns.length} scheduled campaigns to send`);

    const results = [];

    for (const campaign of scheduledCampaigns) {
      try {
        const result = await sendCampaign(campaign._id);
        results.push({
          campaignId: campaign._id,
          name: campaign.name,
          ...result,
        });
      } catch (error) {
        console.error(`Error sending scheduled campaign ${campaign._id}:`, error);
        results.push({
          campaignId: campaign._id,
          name: campaign.name,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error processing scheduled campaigns:', error);
    throw error;
  }
};

/**
 * Track email open
 */
const trackOpen = async (campaignId, salonId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId);
    if (campaign) {
      await campaign.markAsOpened(salonId);
    }
  } catch (error) {
    console.error('Error tracking open:', error);
  }
};

/**
 * Track link click
 */
const trackClick = async (campaignId, salonId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId);
    if (campaign) {
      await campaign.markAsClicked(salonId);
    }
  } catch (error) {
    console.error('Error tracking click:', error);
  }
};

/**
 * Get campaign statistics
 */
const getCampaignStats = async (campaignId) => {
  try {
    const campaign = await EmailCampaign.findById(campaignId).lean();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      ...campaign.stats,
      openRate: campaign.stats.delivered > 0
        ? ((campaign.stats.opened / campaign.stats.delivered) * 100).toFixed(2)
        : 0,
      clickRate: campaign.stats.delivered > 0
        ? ((campaign.stats.clicked / campaign.stats.delivered) * 100).toFixed(2)
        : 0,
      totalRecipients: campaign.totalRecipients,
    };
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    throw error;
  }
};

module.exports = {
  segmentRecipients,
  createCampaign,
  sendCampaign,
  scheduleCampaign,
  processScheduledCampaigns,
  trackOpen,
  trackClick,
  getCampaignStats,
};


